const fs = require('fs');

// Enhanced check: read file, extract all imports, check each name in body
function checkFile(filepath) {
  if (!fs.existsSync(filepath)) return null;
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.split('\n');
  
  // Collect all import statements (handling multi-line)
  const importStatements = [];
  let i = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    
    // ES module import
    if (trimmed.startsWith('import ')) {
      let stmt = trimmed;
      // Multi-line import
      while (!stmt.includes(' from ') && i + 1 < lines.length) {
        i++;
        stmt += ' ' + lines[i].trim();
      }
      // Also handle: import without from (side-effect imports)
      if (stmt.includes(' from ')) {
        importStatements.push(stmt);
      }
    }
    
    // CommonJS require
    if (trimmed.startsWith('const ') && trimmed.includes('require(')) {
      let stmt = trimmed;
      // Multi-line require destructuring
      while (!stmt.includes('require(') && i + 1 < lines.length) {
        i++;
        stmt += ' ' + lines[i].trim();
      }
      importStatements.push(stmt);
    }
    // Multi-line const destructuring that ends with require
    if (trimmed.startsWith('const {') && !trimmed.includes('require(') && !trimmed.includes('=')) {
      let stmt = trimmed;
      let j = i + 1;
      while (j < lines.length && j < i + 10) {
        stmt += ' ' + lines[j].trim();
        if (stmt.includes('require(')) {
          importStatements.push(stmt);
          i = j;
          break;
        }
        j++;
      }
    }
    
    i++;
  }
  
  if (importStatements.length === 0) return null;
  
  const unused = [];
  
  for (const imp of importStatements) {
    // Extract named imports { A, B, C }
    const namedMatch = imp.match(/\{\s*([^}]+)\s*\}/);
    if (namedMatch) {
      const names = namedMatch[1].split(',').map(n => {
        const t = n.trim();
        const asParts = t.split(/\s+as\s+/);
        return asParts[asParts.length - 1].trim();
      }).filter(n => n.length > 0 && /^\w+$/.test(n));
      
      for (const name of names) {
        // Count all word-boundary occurrences in the file
        const regex = new RegExp('\\b' + name + '\\b', 'g');
        const allMatches = content.match(regex) || [];
        // If it only appears once (in the import itself), it's unused
        if (allMatches.length <= 1) {
          unused.push({ name, source: imp.substring(0, 160) });
        }
      }
    }
    
    // Default import before braces: import X, { ... } from
    const defaultBeforeBrace = imp.match(/^import\s+(\w+)\s*,\s*\{/);
    if (defaultBeforeBrace) {
      const name = defaultBeforeBrace[1];
      if (name !== 'React') {
        const regex = new RegExp('\\b' + name + '\\b', 'g');
        const allMatches = content.match(regex) || [];
        if (allMatches.length <= 1) {
          unused.push({ name, source: imp.substring(0, 160) });
        }
      }
    }
    
    // Pure default import: import X from 'y'
    if (!namedMatch) {
      const defaultMatch = imp.match(/^import\s+(\w+)\s+from\s/);
      if (defaultMatch) {
        const name = defaultMatch[1];
        if (name === 'React') continue; // React is often implicitly used
        const regex = new RegExp('\\b' + name + '\\b', 'g');
        const allMatches = content.match(regex) || [];
        if (allMatches.length <= 1) {
          unused.push({ name, source: imp.substring(0, 160) });
        }
        continue;
      }
    }
    
    // const X = require('y') (non-destructured)
    if (!namedMatch) {
      const reqMatch = imp.match(/^const\s+(\w+)\s*=\s*require\(/);
      if (reqMatch) {
        const name = reqMatch[1];
        const regex = new RegExp('\\b' + name + '\\b', 'g');
        const allMatches = content.match(regex) || [];
        if (allMatches.length <= 1) {
          unused.push({ name, source: imp.substring(0, 160) });
        }
        continue;
      }
    }
    
    // import * as X from 'y'
    const starMatch = imp.match(/import\s+\*\s+as\s+(\w+)\s+from/);
    if (starMatch) {
      const name = starMatch[1];
      const regex = new RegExp('\\b' + name + '\\b', 'g');
      const allMatches = content.match(regex) || [];
      if (allMatches.length <= 1) {
        unused.push({ name, source: imp.substring(0, 160) });
      }
    }
  }
  
  return unused.length > 0 ? unused : null;
}

function getFiles(dir, ext) {
  let results = [];
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = dir + '/' + item;
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        if (['node_modules', '.next', 'coverage', '__tests__', 'logs', '.git'].includes(item)) continue;
        results = results.concat(getFiles(full, ext));
      } else if (ext.some(e => full.endsWith(e))) {
        results.push(full);
      }
    }
  } catch (e) { }
  return results;
}

// Get all frontend src files + backend files
const frontendFiles = getFiles('frontend/src', ['.jsx', '.js', '.tsx', '.ts']);
const backendFiles = getFiles('backend', ['.js']).filter(f =>
  !f.includes('node_modules') && !f.includes('coverage') &&
  !f.includes('__tests__') && !f.includes('.test.') && !f.includes('jest.')
);

const allFiles = [...frontendFiles, ...backendFiles];
let totalUnused = 0;

for (const file of allFiles) {
  const result = checkFile(file);
  if (result) {
    const rel = file.replace(/\\/g, '/');
    console.log('FILE: ' + rel);
    console.log('UNUSED IMPORTS:');
    for (const u of result) {
      console.log('  - ' + u.name + '  -->  ' + u.source);
      totalUnused++;
    }
    console.log('');
  }
}

console.log('TOTAL UNUSED IMPORTS FOUND: ' + totalUnused);
console.log('--- AUDIT COMPLETE ---');
