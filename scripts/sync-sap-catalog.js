#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   SAP AI CATALOG SYNC SCRIPT
   Downloads the latest AI use cases from SAP Discovery Center
   using a headless browser (Playwright)

   Usage:
     node scripts/sync-sap-catalog.js
     npm run sync-catalog

   This script uses the Python downloader for better reliability
   ═══════════════════════════════════════════════════════════════ */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  url: 'https://discovery-center.cloud.sap/ai-catalog/',
  outputPath: path.join(__dirname, '..', 'public', 'sap_ai_data.csv'),
  timeout: 90000,
  waitTime: 15000, // Time to wait for table to load
  retries: 3,
  screenshotOnError: true,
  screenshotPath: path.join(__dirname, '..', 'logs', 'sap_debug_screenshot.png'),
};

// Logging helper
function log(emoji, message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${emoji} ${message}`);
}

// Main sync function using Python downloader
async function syncSAPCatalog() {
  log('🚀', 'Starting SAP AI Catalog sync...');
  log('🐍', 'Using Python downloader for reliability...');

  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '..', 'Agents Discovery', 'downloader.py');
    const rawCsvPath = path.join(__dirname, '..', 'Agents Discovery', 'sap_ai_raw_data.csv');
    const publicCsvPath = CONFIG.outputPath;

    // Check if Python script exists
    if (!fs.existsSync(pythonScript)) {
      log('❌', 'Python downloader not found');
      return reject(new Error('Python downloader not found'));
    }

    // Run the Python script
    log('🔄', 'Running Python downloader...');
    const pythonProcess = spawn('python3', [pythonScript], {
      cwd: path.join(__dirname, '..', 'Agents Discovery'),
      env: { ...process.env },
    });

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      const text = data.toString().trim();
      output += text + '\n';
      console.log(text);
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        log('✅', 'Python downloader completed successfully');

        // Copy the downloaded CSV to the public folder
        try {
          if (fs.existsSync(rawCsvPath)) {
            // Ensure public directory exists
            const publicDir = path.dirname(publicCsvPath);
            if (!fs.existsSync(publicDir)) {
              fs.mkdirSync(publicDir, { recursive: true });
            }

            // Copy file
            fs.copyFileSync(rawCsvPath, publicCsvPath);
            log('📋', `Copied CSV to: ${publicCsvPath}`);

            // Get file stats
            const stats = fs.statSync(publicCsvPath);
            const content = fs.readFileSync(publicCsvPath, 'utf-8');
            const lines = content.split('\n').filter(line => line.trim());
            const totalRows = lines.length - 1; // Exclude header

            // Count AI Agents
            const agentLines = lines.filter(line => line.includes('"AI Agent"'));
            const agentCount = agentLines.length;

            // Count AI Features
            const featureLines = lines.filter(line => line.includes('"AI Feature"'));
            const featureCount = featureLines.length;

            log('📊', `File size: ${(stats.size / 1024).toFixed(2)} KB`);
            log('📈', `Total SAP AI use cases: ${totalRows}`);
            log('🤖', `AI Agents: ${agentCount}`);
            log('✨', `AI Features: ${featureCount}`);
            log('🎉', 'Sync completed successfully!');

            resolve({
              success: true,
              rowCount: totalRows,
              agentCount: agentCount,
              featureCount: featureCount,
            });
          } else {
            throw new Error('Downloaded CSV file not found');
          }
        } catch (err) {
          log('❌', `Error copying CSV: ${err.message}`);
          reject(new Error(`Failed to copy CSV: ${err.message}`));
        }
      } else {
        log('❌', `Python downloader failed with exit code ${code}`);
        if (errorOutput) {
          log('⚠️', `Error output: ${errorOutput}`);
        }
        reject(new Error(`Python downloader failed with exit code ${code}`));
      }
    });

    pythonProcess.on('error', (err) => {
      log('❌', `Failed to start Python process: ${err.message}`);
      reject(err);
    });
  });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  syncSAPCatalog()
    .then(result => {
      if (result.success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { syncSAPCatalog };