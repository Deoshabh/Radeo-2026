const fs = require('fs');
const path = require('path');

function getFiles(dir, ext) {
  let results = [];
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        if (['node_modules', '.next', 'coverage', '__tests__', 'logs', 'seed', 'examples'].includes(item)) continue;
        results = results.concat(getFiles(full, ext));
      } else if (ext.some(e => full.endsWith(e))) {
        results.push(full);
      }
    }
  } catch (e) { }
  return results;
}

const frontendFiles = getFiles('frontend/src', ['.jsx', '.js', '.tsx', '.ts']);
const backendFiles = getFiles('backend', ['.js']).filter(f =>
  !f.includes('node_modules') && !f.includes('coverage') &&
  !f.includes('__tests__') && !f.includes('.test.') &&
  !f.includes('jest.') && !f.includes('seed') && !f.includes('examples')
);

const allFiles = [...frontendFiles, ...backendFiles];

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  // Extract imports
  const importLines = [];
  let inMultiLineImport = false;
  let multiLineBuffer = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (inMultiLineImport) {
      multiLineBuffer += ' ' + trimmed;
      if (multiLineBuffer.includes('from ') && (trimmed.endsWith(';') || trimmed.endsWith("'") || trimmed.endsWith('"'))) {
        importLines.push(multiLineBuffer);
        inMultiLineImport = false;
        multiLineBuffer = '';
      } else if (trimmed.includes('require(')) {
        importLines.push(multiLineBuffer);
        inMultiLineImport = false;
        multiLineBuffer = '';
      }
      continue;
    }
    // ES module imports
    if (trimmed.startsWith('import ')) {
      if (trimmed.includes('from ')) {
        importLines.push(trimmed);
      } else if (trimmed.includes('{') && !trimmed.includes('}')) {
        inMultiLineImport = true;
        multiLineBuffer = trimmed;
      } else if (trimmed.includes('{') && trimmed.includes('}') && !trimmed.includes('from')) {
        // partial - keep accumulating
      } else {
        // side-effect import like `import 'x'` - skip
      }
    }
    // CommonJS requires with destructuring
    if (/^const\s+\{/.test(trimmed) && trimmed.includes('require(')) {
      importLines.push(trimmed);
    } else if (/^const\s+\{/.test(trimmed) && !trimmed.includes('require(') && !trimmed.includes('}')) {
      // Could be multiline destructured require
      inMultiLineImport = true;
      multiLineBuffer = trimmed;
    }
    // CommonJS default require
    if (/^const\s+\w+\s*=\s*require\(/.test(trimmed)) {
      importLines.push(trimmed);
    }
  }

  if (importLines.length === 0) continue;

  const unused = [];

  for (const imp of importLines) {
    // Named imports: { A, B, C }
    const namedMatch = imp.match(/\{\s*([^}]+)\s*\}/);
    if (namedMatch) {
      const names = namedMatch[1].split(',').map(n => {
        const trimmedName = n.trim();
        // Handle `X as Y`
        const asParts = trimmedName.split(/\s+as\s+/);
        return asParts[asParts.length - 1].trim();
      }).filter(n => n.length > 0 && !n.includes(' '));

      for (const name of names) {
        const regex = new RegExp('\\b' + escapeRegex(name) + '\\b', 'g');
        const matches = content.match(regex);
        const count = matches ? matches.length : 0;
        // Import itself counts as 1 occurrence
        if (count <= 1) {
          unused.push(name);
        }
      }
      // Also check if there's a default import before the braces
      const defaultBeforeBrace = imp.match(/^import\s+(\w+)\s*,\s*\{/);
      if (defaultBeforeBrace) {
        const name = defaultBeforeBrace[1];
        if (name !== 'React') {
          const regex = new RegExp('\\b' + escapeRegex(name) + '\\b', 'g');
          const matches = content.match(regex);
          const count = matches ? matches.length : 0;
          if (count <= 1) {
            unused.push(name);
          }
        }
      }
      continue;
    }

    // Default import: import X from 'y'
    const defaultMatch = imp.match(/^import\s+(\w+)\s+from\s/);
    if (defaultMatch) {
      const name = defaultMatch[1];
      if (name === 'React') continue;
      const regex = new RegExp('\\b' + escapeRegex(name) + '\\b', 'g');
      const matches = content.match(regex);
      const count = matches ? matches.length : 0;
      if (count <= 1) {
        unused.push(name);
      }
      continue;
    }

    // const X = require('y')
    const reqMatch = imp.match(/^const\s+(\w+)\s*=\s*require\(/);
    if (reqMatch && !imp.includes('{')) {
      const name = reqMatch[1];
      const regex = new RegExp('\\b' + escapeRegex(name) + '\\b', 'g');
      const matches = content.match(regex);
      const count = matches ? matches.length : 0;
      if (count <= 1) {
        unused.push(name);
      }
      continue;
    }

    // import * as X from 'y'
    const starMatch = imp.match(/import\s+\*\s+as\s+(\w+)\s+from/);
    if (starMatch) {
      const name = starMatch[1];
      const regex = new RegExp('\\b' + escapeRegex(name) + '\\b', 'g');
      const matches = content.match(regex);
      const count = matches ? matches.length : 0;
      if (count <= 1) {
        unused.push(name);
      }
    }
  }

  if (unused.length > 0) {
    const rel = path.relative('.', file).replace(/\\/g, '/');
    console.log('FILE: ' + rel);
    console.log('UNUSED IMPORTS:');
    for (const u of unused) {
      // Find the import line that contains this name
      const sourceLine = importLines.find(l => {
        const regex = new RegExp('\\b' + escapeRegex(u) + '\\b');
        return regex.test(l);
      });
      const short = sourceLine ? sourceLine.substring(0, 150) : '?';
      console.log('  - ' + u + '  →  ' + short);
    }
    console.log('');
  }
}

console.log('--- AUDIT COMPLETE ---');
