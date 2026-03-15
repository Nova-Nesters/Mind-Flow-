// metrics.js
// Script to calculate length-based metrics (LOC, NCLOC, CLOC) for your project files

import fs from 'fs';                // Import Node.js file system module to read files
import path from 'path';            // Import path module to handle file paths
import { fileURLToPath } from 'url'; // Utility to resolve current file path in ES modules

// Get current file and directory name (since ES modules don't have __dirname by default)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to recursively collect all .js and .jsx files in a directory
function getSourceFiles(dir) {
  let results = [];                           // Initialize empty list of files
  const list = fs.readdirSync(dir);           // Read all items in the directory
  list.forEach(file => {
    const filePath = path.join(dir, file);    // Build full path for each item
    const stat = fs.statSync(filePath);       // Get file info (is it a file or folder?)
    if (stat && stat.isDirectory()) {
      // If it's a folder, recurse into it
      results = results.concat(getSourceFiles(filePath));
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      // Only include JavaScript/React source files
      results.push(filePath);
    }
  });
  return results;                             // Return collected file paths
}

// Function to calculate LOC metrics for a single file
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8'); // Read file as text
  const lines = content.split('\n');                  // Split into individual lines

  let loc = 0;    // Total lines of code
  let ncloc = 0;  // Non-comment lines of code
  let cloc = 0;   // Comment lines of code

  lines.forEach(line => {
    loc++; // Count every line
    const trimmed = line.trim(); // Remove whitespace for analysis
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      cloc++; // Count comment lines
    } else if (trimmed.length > 0) {
      ncloc++; // Count non-empty, non-comment lines
    }
  });

  // Return metrics for this file
  return { filePath, loc, ncloc, cloc };
}

// Main function to run analysis across all files
function runMetrics() {
  // Support both workspace layouts: script at repo root with app in my-app/src,
  // or script colocated with src.
  const candidateSrcDirs = [
    path.join(__dirname, 'my-app', 'src'),
    path.join(__dirname, 'src'),
  ];
  const srcDir = candidateSrcDirs.find((dir) => fs.existsSync(dir));

  if (!srcDir) {
    console.error('No src directory found. Checked:');
    candidateSrcDirs.forEach((dir) => console.error(`- ${dir}`));
    process.exit(1);
  }

  const files = getSourceFiles(srcDir); // Scan resolved src folder
  let totalLOC = 0, totalNCLOC = 0, totalCLOC = 0;           // Initialize totals

  files.forEach(file => {
    const { loc, ncloc, cloc } = analyzeFile(file);          // Analyze each file
    console.log(`${file}: LOC=${loc}, NCLOC=${ncloc}, CLOC=${cloc}`); // Print per-file metrics
    totalLOC += loc;                                         // Add to totals
    totalNCLOC += ncloc;
    totalCLOC += cloc;
  });

  // Print project-wide summary
  console.log('\n=== Project Metrics Summary ===');
  console.log(`Total LOC: ${totalLOC}`);
  console.log(`Total NCLOC: ${totalNCLOC}`);
  console.log(`Total CLOC: ${totalCLOC}`);
  console.log(`Comment Density: ${(totalCLOC / totalLOC * 100).toFixed(2)}%`);
}

// Execute the script
runMetrics();
