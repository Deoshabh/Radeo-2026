const fs = require('fs');
const path = require('path');

// ============================================================
// BACKEND AUDIT SCRIPT
// ============================================================

const BACKEND = path.join(__dirname, 'backend');
const coreDirs = ['controllers','middleware','utils','services','config','models','jobs','validators','routes'];

function readFile(fp) {
  return fs.readFileSync(fp, 'utf8');
}

function relPath(fp) {
  return path.relative(__dirname, fp).replace(/\\/g, '/');
}

function getAllJsFiles(dir, exclude = []) {
  const results = [];
  function walk(d) {
    for (const f of fs.readdirSync(d)) {
      const fp = path.join(d, f);
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) {
        if (!exclude.includes(f)) walk(fp);
      } else if (f.endsWith('.js')) {
        results.push(fp);
      }
    }
  }
  walk(dir);
  return results;
}

// ============================================================
// 1. UNUSED IMPORTS
// ============================================================
function findUnusedImports() {
  const findings = [];
  const files = getAllJsFiles(BACKEND, ['node_modules','coverage','__tests__','examples','seed','scripts']);
  // also add server.js
  files.push(path.join(BACKEND, 'server.js'));
  
  for (const fp of [...new Set(files)]) {
    if (!fs.existsSync(fp)) continue;
    const content = readFile(fp);
    const lines = content.split('\n');
    
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
      
      // Only top-level (not deeply indented - allow up to 2 spaces)
      if (/^\s{4,}/.test(line)) return;
      
      // const X = require(...)
      let match = trimmed.match(/^const\s+(\w+)\s*=\s*require\s*\(/);
      if (match) {
        const varName = match[1];
        const otherContent = lines.filter((_, j) => j !== i).join('\n');
        const re = new RegExp('\\b' + varName + '\\b');
        if (!re.test(otherContent)) {
          findings.push({ file: relPath(fp), line: i+1, variable: varName, import: trimmed.substring(0, 120) });
        }
        return;
      }
      
      // const { X, Y } = require(...)  or  const { X: alias } = require(...)
      match = trimmed.match(/^const\s*\{([^}]+)\}\s*=\s*require\s*\(/);
      if (match) {
        const vars = match[1].split(',').map(v => {
          const parts = v.trim().split(/\s*:\s*/);
          return parts[parts.length - 1].trim();
        }).filter(Boolean);
        
        vars.forEach(varName => {
          if (!varName || varName.includes(' ')) return;
          const otherContent = lines.filter((_, j) => j !== i).join('\n');
          const re = new RegExp('\\b' + varName + '\\b');
          if (!re.test(otherContent)) {
            findings.push({ file: relPath(fp), line: i+1, variable: varName, import: trimmed.substring(0, 120) });
          }
        });
      }
    });
  }
  return findings;
}

// ============================================================
// 2. UNUSED EXPORTED FUNCTIONS (utils/middleware/services)
// ============================================================
function findUnusedExports() {
  const findings = [];
  
  // Collect all exports from utils, middleware, services
  const exportDirs = ['utils','middleware','services'];
  const allExports = []; // { file, name }
  
  for (const dir of exportDirs) {
    const dirPath = path.join(BACKEND, dir);
    if (!fs.existsSync(dirPath)) continue;
    
    for (const f of fs.readdirSync(dirPath).filter(f => f.endsWith('.js'))) {
      const fp = path.join(dirPath, f);
      const content = readFile(fp);
      
      // module.exports = { fn1, fn2 }
      let match = content.match(/module\.exports\s*=\s*\{([^}]+)\}/);
      if (match) {
        const names = match[1].split(',').map(n => n.trim().split(':')[0].trim()).filter(n => n && !n.includes(' '));
        names.forEach(name => allExports.push({ file: relPath(fp), name, dir }));
      }
      
      // module.exports = X
      match = content.match(/module\.exports\s*=\s*(\w+)\s*;/);
      if (match && !content.includes('module.exports = {')) {
        allExports.push({ file: relPath(fp), name: match[1], dir });
      }
      
      // exports.X = ...
      const exportMatches = content.matchAll(/exports\.(\w+)\s*=/g);
      for (const m of exportMatches) {
        allExports.push({ file: relPath(fp), name: m[1], dir });
      }
    }
  }
  
  // Now check if each export is imported anywhere in the backend
  const allBackendFiles = getAllJsFiles(BACKEND, ['node_modules','coverage','__tests__']);
  const allBackendContent = {};
  for (const fp of allBackendFiles) {
    allBackendContent[fp] = readFile(fp);
  }
  
  for (const exp of allExports) {
    let found = false;
    for (const [fp, content] of Object.entries(allBackendContent)) {
      if (relPath(fp) === exp.file) continue; // skip self
      const re = new RegExp('\\b' + exp.name + '\\b');
      if (re.test(content)) {
        found = true;
        break;
      }
    }
    if (!found) {
      findings.push(exp);
    }
  }
  
  return findings;
}

// ============================================================
// 3. DEAD ROUTES - controller functions referenced in routes but potentially missing
// ============================================================
function findDeadRoutes() {
  const findings = [];
  const routesDir = path.join(BACKEND, 'routes');
  
  for (const f of fs.readdirSync(routesDir).filter(f => f.endsWith('.js'))) {
    const fp = path.join(routesDir, f);
    const content = readFile(fp);
    const lines = content.split('\n');
    
    // Find all controller imports
    const requireMatches = [...content.matchAll(/require\s*\(\s*["']([^"']+)["']\s*\)/g)];
    
    for (const rm of requireMatches) {
      const modPath = rm[1];
      if (!modPath.includes('controllers/')) continue;
      
      // Resolve the controller file
      const controllerFile = path.resolve(path.dirname(fp), modPath + '.js');
      if (!fs.existsSync(controllerFile)) {
        findings.push({ routeFile: relPath(fp), issue: 'Controller file not found: ' + modPath });
        continue;
      }
      
      const controllerContent = readFile(controllerFile);
      
      // Find what's destructured from the controller
      const line = lines.find(l => l.includes(modPath));
      if (!line) continue;
      
      const destructMatch = line.match(/\{([^}]+)\}/);
      if (destructMatch) {
        const funcs = destructMatch[1].split(',').map(f => f.trim()).filter(Boolean);
        for (const func of funcs) {
          // Check if function exists in controller exports
          if (!controllerContent.includes(func)) {
            findings.push({ routeFile: relPath(fp), issue: `Function "${func}" imported but not found in controller` });
          }
        }
      }
    }
  }
  
  return findings;
}

// ============================================================
// 4. CONSOLE STATEMENTS (in core files, not scripts/seed)
// ============================================================
function findConsoleStatements() {
  const findings = [];
  const files = getAllJsFiles(BACKEND, ['node_modules','coverage','__tests__','examples','seed','scripts']);
  
  for (const fp of files) {
    const content = readFile(fp);
    const lines = content.split('\n');
    
    lines.forEach((line, i) => {
      const match = line.match(/console\.(log|warn|error|info|debug)\s*\(/);
      if (match) {
        const rel = relPath(fp);
        const trimmed = line.trim();
        
        // Categorize
        let category;
        if (rel.includes('utils/logger.js')) {
          category = 'ACCEPTABLE (logger implementation)';
        } else if (rel.includes('utils/makeAdmin.js')) {
          category = 'ACCEPTABLE (CLI utility)';
        } else if (rel.includes('config/env.js')) {
          category = 'ACCEPTABLE (env validation)';
        } else if (rel.includes('server.js') && (trimmed.includes('listening') || trimmed.includes('MongoDB') || trimmed.includes('started'))) {
          category = 'ACCEPTABLE (startup)';
        } else if (trimmed.includes('DEBUG') || trimmed.includes('debug')) {
          category = 'DELETE (debug leftover)';
        } else if (match[1] === 'error') {
          category = 'REPLACE with logger';
        } else if (match[1] === 'warn') {
          category = 'REPLACE with logger';
        } else {
          category = 'REPLACE with logger';
        }
        
        findings.push({ file: rel, line: i+1, method: 'console.' + match[1], category, code: trimmed.substring(0, 120) });
      }
    });
  }
  return findings;
}

// ============================================================
// 5. COMMENTED-OUT CODE
// ============================================================
function findCommentedCode() {
  const findings = [];
  const files = getAllJsFiles(BACKEND, ['node_modules','coverage','__tests__','examples','seed','scripts']);
  
  const codePatterns = /^\s*\/\/\s*(const |let |var |if\s*\(|else\s*\{|for\s*\(|while\s*\(|return |await |\.then\(|\.catch\(|require\(|module\.exports|router\.|app\.use|res\.(json|send|status)|req\.(body|params|query))/;
  
  for (const fp of files) {
    const content = readFile(fp);
    const lines = content.split('\n');
    
    lines.forEach((line, i) => {
      if (codePatterns.test(line)) {
        // Exclude legitimate comments that happen to start with code words
        const trimmed = line.trim();
        if (trimmed.startsWith('// If ') || trimmed.startsWith('// For ') || trimmed.startsWith('// Return ') || trimmed.startsWith('// Let\'s')) return;
        if (trimmed.startsWith('// req.') && trimmed.includes(' is ')) return; // descriptive comment
        
        findings.push({ file: relPath(fp), line: i+1, code: trimmed.substring(0, 120) });
      }
    });
  }
  return findings;
}

// ============================================================
// 6. DUAL MODEL FILES (SiteSetting vs SiteSettings)
// ============================================================
function findDualModels() {
  const findings = [];
  const modelsDir = path.join(BACKEND, 'models');
  const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js')).map(f => f.replace('.js',''));
  
  // Check for similar model names
  for (let i = 0; i < files.length; i++) {
    for (let j = i+1; j < files.length; j++) {
      if (files[i].toLowerCase() === files[j].toLowerCase() || 
          files[i] + 's' === files[j] || files[j] + 's' === files[i] ||
          files[i] + 'S' === files[j] || files[j] + 'S' === files[i]) {
        findings.push({ model1: files[i], model2: files[j] });
      }
    }
  }
  return findings;
}


// ============================================================
// RUN ALL CHECKS
// ============================================================
console.log('========================================');
console.log(' BACKEND AUDIT REPORT');
console.log('========================================\n');

console.log('--- 1. UNUSED IMPORTS ---');
const unusedImports = findUnusedImports();
if (unusedImports.length === 0) {
  console.log('  None found.\n');
} else {
  unusedImports.forEach(u => {
    console.log(`  ${u.file}:${u.line} | UNUSED: "${u.variable}" | ${u.import}`);
  });
  console.log(`\n  Total: ${unusedImports.length}\n`);
}

console.log('--- 2. UNUSED EXPORTS (never imported elsewhere) ---');
const unusedExports = findUnusedExports();
if (unusedExports.length === 0) {
  console.log('  None found.\n');
} else {
  unusedExports.forEach(u => {
    console.log(`  ${u.file} | UNUSED EXPORT: "${u.name}"`);
  });
  console.log(`\n  Total: ${unusedExports.length}\n`);
}

console.log('--- 3. DEAD ROUTES ---');
const deadRoutes = findDeadRoutes();
if (deadRoutes.length === 0) {
  console.log('  None found.\n');
} else {
  deadRoutes.forEach(u => {
    console.log(`  ${u.routeFile} | ${u.issue}`);
  });
  console.log(`\n  Total: ${deadRoutes.length}\n`);
}

console.log('--- 4. CONSOLE STATEMENTS (core files) ---');
const consoleStmts = findConsoleStatements();
if (consoleStmts.length === 0) {
  console.log('  None found.\n');
} else {
  consoleStmts.forEach(u => {
    console.log(`  [${u.category}] ${u.file}:${u.line} | ${u.code}`);
  });
  console.log(`\n  Total: ${consoleStmts.length}\n`);
}

console.log('--- 5. COMMENTED-OUT CODE ---');
const commentedCode = findCommentedCode();
if (commentedCode.length === 0) {
  console.log('  None found.\n');
} else {
  commentedCode.forEach(u => {
    console.log(`  ${u.file}:${u.line} | ${u.code}`);
  });
  console.log(`\n  Total: ${commentedCode.length}\n`);
}

console.log('--- 6. DUPLICATE/SIMILAR MODELS ---');
const dualModels = findDualModels();
if (dualModels.length === 0) {
  console.log('  None found.\n');
} else {
  dualModels.forEach(u => {
    console.log(`  Potential duplicates: ${u.model1} vs ${u.model2}`);
  });
  console.log();
}

console.log('========================================');
console.log(' END OF REPORT');
console.log('========================================');
