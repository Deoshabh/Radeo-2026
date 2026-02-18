/**
 * Comprehensive audit script for unused imports, variables, functions, and dead code
 * in frontend/src/
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRONTEND_SRC = path.join(__dirname, 'frontend', 'src');

// Recursively find all .jsx, .js, .ts files
function findFiles(dir, extensions = ['.jsx', '.js', '.ts']) {
  let results = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        // skip node_modules, __tests__, coverage, .next
        if (['node_modules', '__tests__', 'coverage', '.next', '__mocks__'].includes(item.name)) continue;
        results = results.concat(findFiles(fullPath, extensions));
      } else if (extensions.some(ext => item.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  } catch (e) { /* skip unreadable dirs */ }
  return results;
}

// Parse imports from file content
function parseImports(content) {
  const imports = [];
  
  // Match: import X from '...'
  // Match: import { A, B, C } from '...'
  // Match: import X, { A, B } from '...'
  // Match: import * as X from '...'
  const importRegex = /^import\s+(.+?)\s+from\s+['"]([^'"]+)['"]/gm;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const importClause = match[1].trim();
    const source = match[2];
    const lineNum = content.substring(0, match.index).split('\n').length;
    
    // Parse the import clause
    // Case: import * as X from '...'
    const namespaceMatch = importClause.match(/^\*\s+as\s+(\w+)/);
    if (namespaceMatch) {
      imports.push({ name: namespaceMatch[1], type: 'namespace', source, line: lineNum });
      continue;
    }
    
    // Case: import X, { A, B } from '...'
    // Case: import X from '...'
    // Case: import { A, B } from '...'
    
    // Extract default import
    const defaultMatch = importClause.match(/^(\w+)(?:\s*,)?/);
    if (defaultMatch && !importClause.startsWith('{')) {
      imports.push({ name: defaultMatch[1], type: 'default', source, line: lineNum });
    }
    
    // Extract named imports
    const namedMatch = importClause.match(/\{([^}]+)\}/);
    if (namedMatch) {
      const names = namedMatch[1].split(',').map(n => {
        const parts = n.trim().split(/\s+as\s+/);
        return parts.length > 1 ? parts[1].trim() : parts[0].trim();
      }).filter(n => n.length > 0);
      
      for (const name of names) {
        imports.push({ name, type: 'named', source, line: lineNum });
      }
    }
  }
  
  // Also match: import '...' (side-effect imports - these are always "used")
  // We skip these.
  
  return imports;
}

// Check if an imported name is used in the file body (excluding the import line itself)
function isImportUsed(name, content, importLine) {
  // Remove all import lines from content to avoid self-matching
  const lines = content.split('\n');
  const bodyLines = lines.map((line, idx) => {
    // Remove all import statements
    if (/^\s*import\s+/.test(line)) return '';
    return line;
  });
  const body = bodyLines.join('\n');
  
  // Remove single-line comments
  const noComments = body.replace(/\/\/.*$/gm, '');
  // Remove multi-line comments  
  const noMultiComments = noComments.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove string literals to avoid false positives
  // (simple approach - remove quoted strings)
  
  // Check for word boundary usage
  const regex = new RegExp(`\\b${escapeRegex(name)}\\b`);
  return regex.test(noMultiComments);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Find unused useState variables
function findUnusedStateVars(content) {
  const results = [];
  const stateRegex = /const\s+\[(\w+),\s*(\w+)\]\s*=\s*useState/g;
  let match;
  
  while ((match = stateRegex.exec(content)) !== null) {
    const stateName = match[1];
    const setterName = match[2];
    const lineNum = content.substring(0, match.index).split('\n').length;
    
    // Check if state variable is used (beyond declaration)
    const afterDecl = content.substring(match.index + match[0].length);
    
    if (!new RegExp(`\\b${escapeRegex(stateName)}\\b`).test(afterDecl)) {
      results.push({ name: stateName, type: 'state-var', line: lineNum, reason: 'State variable declared but never read' });
    }
    if (!new RegExp(`\\b${escapeRegex(setterName)}\\b`).test(afterDecl)) {
      results.push({ name: setterName, type: 'state-setter', line: lineNum, reason: 'State setter declared but never called' });
    }
  }
  return results;
}

// Find unused function declarations  
function findUnusedFunctions(content) {
  const results = [];
  
  // Match: const funcName = (...)  => or function funcName(...)
  // But skip component definitions (starts with uppercase and is at top level)
  const funcRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=])\s*=>/gm;
  let match;
  
  while ((match = funcRegex.exec(content)) !== null) {
    const funcName = match[1];
    const lineNum = content.substring(0, match.index).split('\n').length;
    
    // Skip if it's the main component (PascalCase at top level)
    if (/^[A-Z]/.test(funcName)) continue;
    // Skip if it looks like event handler used in JSX or passed as prop
    
    const afterDecl = content.substring(match.index + match[0].length);
    const beforeDecl = content.substring(0, match.index);
    
    // Check usage after declaration
    if (!new RegExp(`\\b${escapeRegex(funcName)}\\b`).test(afterDecl)) {
      results.push({ name: funcName, type: 'function', line: lineNum, reason: 'Function defined but never called after declaration' });
    }
  }
  
  return results;
}

// Find unused useRef
function findUnusedRefs(content) {
  const results = [];
  const refRegex = /const\s+(\w+)\s*=\s*useRef\(/g;
  let match;
  
  while ((match = refRegex.exec(content)) !== null) {
    const refName = match[1];
    const lineNum = content.substring(0, match.index).split('\n').length;
    const afterDecl = content.substring(match.index + match[0].length);
    
    // Check if ref is used (ref={refName} or refName.current)
    const usageRegex = new RegExp(`\\b${escapeRegex(refName)}\\b`);
    if (!usageRegex.test(afterDecl)) {
      results.push({ name: refName, type: 'ref', line: lineNum, reason: 'useRef declared but never used' });
    }
  }
  
  return results;
}

// Find commented-out code blocks
function findCommentedCode(content, filePath) {
  const results = [];
  const lines = content.split('\n');
  
  let inBlockComment = false;
  let blockStart = -1;
  let blockContent = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Track block comments
    if (line.includes('/*') && !line.includes('*/')) {
      inBlockComment = true;
      blockStart = i + 1;
      blockContent = [line];
      continue;
    }
    if (inBlockComment) {
      blockContent.push(line);
      if (line.includes('*/')) {
        inBlockComment = false;
        // Check if the block comment contains code-like patterns
        const blockText = blockContent.join('\n');
        if (looksLikeCode(blockText) && blockContent.length > 2) {
          results.push({ line: blockStart, content: blockContent.slice(0, 3).join(' ').substring(0, 120) + '...', type: 'block-comment' });
        }
        blockContent = [];
      }
      continue;
    }
    
    // Single-line comments that look like code
    if (line.startsWith('//') && !line.startsWith('///') && !line.startsWith('// @') && !line.startsWith('// TODO') && !line.startsWith('// NOTE') && !line.startsWith('// FIXME')) {
      const commentBody = line.substring(2).trim();
      if (looksLikeCode(commentBody) && commentBody.length > 15) {
        // Check if it's part of a consecutive block of commented code
        let endLine = i;
        while (endLine + 1 < lines.length && lines[endLine + 1].trim().startsWith('//') && looksLikeCode(lines[endLine + 1].trim().substring(2))) {
          endLine++;
        }
        if (endLine > i) { // Multi-line commented code
          results.push({ line: i + 1, endLine: endLine + 1, content: commentBody.substring(0, 100), type: 'consecutive-comments' });
          // Skip ahead
          i = endLine;
        }
      }
    }
  }
  
  return results;
}

function looksLikeCode(text) {
  // Heuristic: looks like code if it contains code patterns
  const codePatterns = [
    /\bconst\s+\w+/, /\blet\s+\w+/, /\bvar\s+\w+/,
    /\bfunction\s+\w+/, /\breturn\s+/,
    /\bif\s*\(/, /\belse\s*{/, /\bfor\s*\(/,
    /\bimport\s+/, /\bexport\s+/,
    /\bconsole\.\w+/, /\bawait\s+/,
    /\buseState\b/, /\buseEffect\b/,
    /\bsetState\b/, /\bsetTimeout\b/,
    /=>\s*{/, /\(\)\s*=>/,
    /<\w+[\s/>]/, // JSX tags
    /\w+\.\w+\(/, // method calls
    /\{\.\.\./, // spread operator
  ];
  return codePatterns.some(p => p.test(text));
}

// Main audit
function audit() {
  const files = findFiles(FRONTEND_SRC);
  console.log(`Found ${files.length} files to audit\n`);
  
  const allFindings = [];
  
  for (const filePath of files) {
    const relativePath = path.relative(path.join(__dirname, 'frontend'), filePath).replace(/\\/g, '/');
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
      continue;
    }
    
    const findings = [];
    
    // 1. Check unused imports
    const imports = parseImports(content);
    for (const imp of imports) {
      if (!isImportUsed(imp.name, content, imp.line)) {
        findings.push({
          type: 'UNUSED_IMPORT',
          name: imp.name,
          line: imp.line,
          source: imp.source,
          reason: `Imported from '${imp.source}' but never used in file body`
        });
      }
    }
    
    // 2. Check unused state variables
    const unusedState = findUnusedStateVars(content);
    findings.push(...unusedState.map(s => ({ ...s, type: 'UNUSED_' + s.type.toUpperCase() })));
    
    // 3. Check unused refs
    const unusedRefs = findUnusedRefs(content);
    findings.push(...unusedRefs.map(r => ({ ...r, type: 'UNUSED_REF' })));
    
    // 4. Check commented-out code
    const commentedCode = findCommentedCode(content, filePath);
    findings.push(...commentedCode.map(c => ({
      type: 'COMMENTED_CODE',
      line: c.line,
      endLine: c.endLine,
      content: c.content,
      reason: `Commented-out code block (${c.type})`
    })));
    
    if (findings.length > 0) {
      allFindings.push({ file: relativePath, findings });
    }
  }
  
  // Output results
  console.log('='.repeat(100));
  console.log('FRONTEND UNUSED CODE AUDIT REPORT');
  console.log('='.repeat(100));
  
  let totalUnusedImports = 0;
  let totalUnusedState = 0;
  let totalUnusedRefs = 0;
  let totalCommentedCode = 0;
  
  // Group by category
  const unusedImportFindings = [];
  const unusedVarFindings = [];
  const commentedCodeFindings = [];
  
  for (const { file, findings } of allFindings) {
    for (const f of findings) {
      if (f.type === 'UNUSED_IMPORT') {
        unusedImportFindings.push({ file, ...f });
        totalUnusedImports++;
      } else if (f.type === 'COMMENTED_CODE') {
        commentedCodeFindings.push({ file, ...f });
        totalCommentedCode++;
      } else {
        unusedVarFindings.push({ file, ...f });
        if (f.type === 'UNUSED_REF') totalUnusedRefs++;
        else totalUnusedState++;
      }
    }
  }
  
  // Print UNUSED IMPORTS
  console.log('\n' + '='.repeat(80));
  console.log(`1. UNUSED IMPORTS (${totalUnusedImports} found)`);
  console.log('='.repeat(80));
  
  // Group by file
  const importsByFile = {};
  for (const f of unusedImportFindings) {
    if (!importsByFile[f.file]) importsByFile[f.file] = [];
    importsByFile[f.file].push(f);
  }
  
  for (const [file, findings] of Object.entries(importsByFile)) {
    console.log(`\n  📁 ${file}`);
    for (const f of findings) {
      console.log(`     Line ${f.line}: ${f.name} — ${f.reason}`);
    }
  }
  
  // Print UNUSED VARIABLES/STATE/REFS
  console.log('\n' + '='.repeat(80));
  console.log(`2. UNUSED VARIABLES/STATE/REFS (${unusedVarFindings.length} found)`);
  console.log('='.repeat(80));
  
  const varsByFile = {};
  for (const f of unusedVarFindings) {
    if (!varsByFile[f.file]) varsByFile[f.file] = [];
    varsByFile[f.file].push(f);
  }
  
  for (const [file, findings] of Object.entries(varsByFile)) {
    console.log(`\n  📁 ${file}`);
    for (const f of findings) {
      console.log(`     Line ${f.line}: ${f.name} (${f.type}) — ${f.reason}`);
    }
  }
  
  // Print COMMENTED CODE
  console.log('\n' + '='.repeat(80));
  console.log(`3. COMMENTED-OUT CODE BLOCKS (${totalCommentedCode} found)`);
  console.log('='.repeat(80));
  
  const commentsByFile = {};
  for (const f of commentedCodeFindings) {
    if (!commentsByFile[f.file]) commentsByFile[f.file] = [];
    commentsByFile[f.file].push(f);
  }
  
  for (const [file, findings] of Object.entries(commentsByFile)) {
    console.log(`\n  📁 ${file}`);
    for (const f of findings) {
      const lineRange = f.endLine ? `Lines ${f.line}-${f.endLine}` : `Line ${f.line}`;
      console.log(`     ${lineRange}: ${f.content}`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`  Unused imports:       ${totalUnusedImports}`);
  console.log(`  Unused state/setters: ${totalUnusedState}`);
  console.log(`  Unused refs:          ${totalUnusedRefs}`);
  console.log(`  Commented-out code:   ${totalCommentedCode}`);
  console.log(`  Total findings:       ${totalUnusedImports + totalUnusedState + totalUnusedRefs + totalCommentedCode}`);
  console.log(`  Files with issues:    ${allFindings.length} / ${files.length}`);
}

audit();
