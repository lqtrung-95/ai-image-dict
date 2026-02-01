#!/usr/bin/env node
/**
 * Build script for native app
 * Builds Next.js and copies UI files with proper directory structure for Capacitor
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building for native app...');

// Build Next.js normally
console.log('Building Next.js...');
execSync('npx next build', { stdio: 'inherit' });

// Create dist directory
const distDir = path.join(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy static files
console.log('Copying static files...');
const staticSource = path.join(process.cwd(), '.next/static');
const staticDest = path.join(distDir, '_next/static');
if (fs.existsSync(staticSource)) {
  fs.cpSync(staticSource, staticDest, { recursive: true });
}

// Copy HTML files from server directory
console.log('Copying HTML files...');
const serverDir = path.join(process.cwd(), '.next/server/app');

function copyHtmlFiles(source, dest, isRoot = false) {
  if (!fs.existsSync(source)) return;

  const items = fs.readdirSync(source);
  for (const item of items) {
    const sourcePath = path.join(source, item);
    const stat = fs.statSync(sourcePath);

    // Skip API routes and special folders
    if (item === 'api' || item.startsWith('_')) continue;

    if (stat.isDirectory()) {
      // For grouped routes like (auth), flatten them
      const destItem = item.startsWith('(') && item.endsWith(')') ? '' : item;
      const destPath = destItem ? path.join(dest, destItem) : dest;

      if (destItem) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyHtmlFiles(sourcePath, destPath);
    } else if (item.endsWith('.html')) {
      // Skip special HTML files at root level
      if (isRoot && item.startsWith('_')) continue;
      fs.copyFileSync(sourcePath, path.join(dest, item));
    }
  }
}

copyHtmlFiles(serverDir, distDir, true);

// Fix: Copy HTML files from nested page directories to their parent
function flattenPageDirs(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory() && item === 'page') {
      // Move HTML files from page/ to parent
      const pageFiles = fs.readdirSync(itemPath);
      for (const file of pageFiles) {
        if (file.endsWith('.html')) {
          const parentName = path.basename(dir);
          const destName = parentName + '.html';
          fs.copyFileSync(path.join(itemPath, file), path.join(path.dirname(dir), destName));
        }
      }
    } else if (stat.isDirectory()) {
      flattenPageDirs(itemPath);
    }
  }
}

flattenPageDirs(distDir);

// Ensure index.html exists
const rootHtml = path.join(distDir, 'index.html');
if (!fs.existsSync(rootHtml)) {
  const rootPageHtml = path.join(serverDir, 'index.html');
  if (fs.existsSync(rootPageHtml)) {
    fs.copyFileSync(rootPageHtml, rootHtml);
  } else {
    console.error('ERROR: index.html not found!');
    process.exit(1);
  }
}

// Convert flat HTML files to directory-based routing for Capacitor
console.log('Converting to directory-based routing...');
const htmlFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.html') && f !== 'index.html' && f !== '200.html');

for (const htmlFile of htmlFiles) {
  const fileName = htmlFile.replace('.html', '');
  const dirPath = path.join(distDir, fileName);

  // Create directory
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Move HTML file to directory as index.html
  fs.copyFileSync(path.join(distDir, htmlFile), path.join(dirPath, 'index.html'));

  // Remove original flat file
  fs.unlinkSync(path.join(distDir, htmlFile));
}

// Copy other static assets
const publicDir = path.join(process.cwd(), 'public');
if (fs.existsSync(publicDir)) {
  console.log('Copying public assets...');
  const items = fs.readdirSync(publicDir);
  for (const item of items) {
    const sourcePath = path.join(publicDir, item);
    const destPath = path.join(distDir, item);

    if (fs.existsSync(destPath)) {
      fs.rmSync(destPath, { recursive: true });
    }
    fs.cpSync(sourcePath, destPath, { recursive: true });
  }
}

// Verify build output
const files = fs.readdirSync(distDir);
console.log('\nBuild output:');
files.forEach(f => {
  const stat = fs.statSync(path.join(distDir, f));
  if (stat.isDirectory() && !f.startsWith('_') && !f.startsWith('.')) {
    console.log(`  - ${f}/`);
  }
});

if (!files.includes('index.html')) {
  console.error('\nERROR: index.html is missing!');
  process.exit(1);
}

console.log('\nBuild complete! Output in dist/');
