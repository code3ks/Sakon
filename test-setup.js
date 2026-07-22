#!/usr/bin/env node

/**
 * Setup verification script for Sakon ABU
 * Run this to check if everything is properly configured
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import http from 'http';

const execAsync = promisify(exec);

console.log('🔍 Sakon ABU Setup Verification\n');

const checks = [];

// Check 1: Node.js version
async function checkNode() {
  try {
    const { stdout } = await execAsync('node --version');
    const version = stdout.trim();
    const major = parseInt(version.slice(1).split('.')[0]);
    
    if (major >= 18) {
      checks.push({ name: 'Node.js', status: '✅', detail: version });
    } else {
      checks.push({ name: 'Node.js', status: '❌', detail: `${version} (need v18+)` });
    }
  } catch (error) {
    checks.push({ name: 'Node.js', status: '❌', detail: 'Not installed' });
  }
}

// Check 2: npm
async function checkNpm() {
  try {
    const { stdout } = await execAsync('npm --version');
    checks.push({ name: 'npm', status: '✅', detail: stdout.trim() });
  } catch (error) {
    checks.push({ name: 'npm', status: '❌', detail: 'Not installed' });
  }
}

// Check 3: Ollama
async function checkOllama() {
  try {
    const { stdout } = await execAsync('ollama --version');
    checks.push({ name: 'Ollama', status: '✅', detail: stdout.trim() });
  } catch (error) {
    checks.push({ name: 'Ollama', status: '⚠️', detail: 'Not installed (optional but recommended)' });
  }
}

// Check 4: Ollama running
async function checkOllamaRunning() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:11434', (res) => {
      checks.push({ name: 'Ollama Service', status: '✅', detail: 'Running on port 11434' });
      resolve();
    });
    
    req.on('error', () => {
      checks.push({ name: 'Ollama Service', status: '⚠️', detail: 'Not running (start with: ollama serve)' });
      resolve();
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      checks.push({ name: 'Ollama Service', status: '⚠️', detail: 'Timeout' });
      resolve();
    });
  });
}

// Check 5: Gemma model
async function checkGemmaModel() {
  try {
    const { stdout } = await execAsync('ollama list');
    if (stdout.includes('gemma4')) {
      const variant = stdout.match(/gemma4:(\w+)/)?.[1] || 'unknown';
      checks.push({ name: 'Gemma 4 Model', status: '✅', detail: `gemma4:${variant}` });
    } else {
      checks.push({ name: 'Gemma 4 Model', status: '❌', detail: 'Not pulled (run: ollama pull gemma4:e2b)' });
    }
  } catch (error) {
    checks.push({ name: 'Gemma 4 Model', status: '⚠️', detail: 'Could not check (Ollama not installed?)' });
  }
}

// Check 6: Dependencies
async function checkDependencies() {
  try {
    const fs = await import('fs');
    if (fs.existsSync('./node_modules')) {
      checks.push({ name: 'Dependencies', status: '✅', detail: 'Installed' });
    } else {
      checks.push({ name: 'Dependencies', status: '❌', detail: 'Not installed (run: npm install)' });
    }
  } catch (error) {
    checks.push({ name: 'Dependencies', status: '❌', detail: 'Error checking' });
  }
}

// Run all checks
async function runChecks() {
  await checkNode();
  await checkNpm();
  await checkDependencies();
  await checkOllama();
  await checkOllamaRunning();
  await checkGemmaModel();
  
  // Print results
  console.log('Results:\n');
  checks.forEach(check => {
    console.log(`${check.status} ${check.name.padEnd(20)} ${check.detail}`);
  });
  
  // Summary
  const passed = checks.filter(c => c.status === '✅').length;
  const failed = checks.filter(c => c.status === '❌').length;
  const warnings = checks.filter(c => c.status === '⚠️').length;
  
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`✅ Passed: ${passed}   ❌ Failed: ${failed}   ⚠️  Warnings: ${warnings}`);
  
  if (failed === 0) {
    console.log('\n🎉 All critical checks passed! You\'re ready to run:');
    console.log('   npm run dev');
  } else {
    console.log('\n⚠️  Some checks failed. Please fix them before running the app.');
  }
  
  // Next steps
  console.log('\n📚 Next steps:');
  if (failed > 0) {
    console.log('   1. Fix the failed checks above');
    console.log('   2. Run this script again to verify');
  } else {
    console.log('   1. Run: npm run dev');
    console.log('   2. Open: http://localhost:3000');
    console.log('   3. See DEMO_SCENARIOS.md for test scenarios');
  }
}

runChecks().catch(console.error);
