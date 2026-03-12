#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════
   SAP AI CATALOG SYNC API SERVER
   Simple Express server to trigger sync from the UI
   
   Usage:
     node scripts/sync-api-server.js
     npm run sync-server
   
   Endpoints:
     POST /api/sync - Trigger sync
     GET /api/sync/status - Get sync status
   ═══════════════════════════════════════════════════════════════ */

import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.SYNC_API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// State
let syncInProgress = false;
let lastSyncResult = null;
let lastSyncTime = null;

// Logging helper
function log(emoji, message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${emoji} ${message}`);
}

/**
 * POST /api/sync - Trigger a sync
 */
app.post('/api/sync', async (req, res) => {
  if (syncInProgress) {
    return res.status(409).json({
      success: false,
      error: 'Sync already in progress',
      status: 'SYNCING',
    });
  }

  log('🚀', 'Manual sync triggered from UI');
  syncInProgress = true;
  lastSyncResult = null;

  // Run the sync script
  const scriptPath = path.join(__dirname, 'sync-sap-catalog.js');
  
  // Send immediate response
  res.json({
    success: true,
    message: 'Sync started',
    status: 'SYNCING',
  });

  // Run sync in background
  try {
    const syncProcess = spawn('node', [scriptPath], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env },
    });

    let output = '';
    let errorOutput = '';

    syncProcess.stdout.on('data', (data) => {
      output += data.toString();
      log('📝', data.toString().trim());
    });

    syncProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      log('⚠️', data.toString().trim());
    });

    syncProcess.on('close', (code) => {
      syncInProgress = false;
      lastSyncTime = new Date().toISOString();
      
      if (code === 0) {
        lastSyncResult = {
          success: true,
          message: 'Sync completed successfully',
          output: output,
          completedAt: lastSyncTime,
        };
        log('✅', 'Sync completed successfully');
      } else {
        lastSyncResult = {
          success: false,
          error: `Sync failed with exit code ${code}`,
          output: output,
          errorOutput: errorOutput,
          completedAt: lastSyncTime,
        };
        log('❌', `Sync failed with exit code ${code}`);
      }
    });

    syncProcess.on('error', (err) => {
      syncInProgress = false;
      lastSyncTime = new Date().toISOString();
      lastSyncResult = {
        success: false,
        error: err.message,
        completedAt: lastSyncTime,
      };
      log('❌', `Sync error: ${err.message}`);
    });

  } catch (err) {
    syncInProgress = false;
    lastSyncTime = new Date().toISOString();
    lastSyncResult = {
      success: false,
      error: err.message,
      completedAt: lastSyncTime,
    };
    log('❌', `Failed to start sync: ${err.message}`);
  }
});

/**
 * GET /api/sync/status - Get current sync status
 */
app.get('/api/sync/status', (req, res) => {
  // Check if CSV file exists and get its modification time
  const csvPath = path.join(__dirname, '..', 'public', 'sap_ai_data.csv');
  let csvInfo = null;
  
  try {
    if (fs.existsSync(csvPath)) {
      const stats = fs.statSync(csvPath);
      const content = fs.readFileSync(csvPath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());
      
      csvInfo = {
        exists: true,
        lastModified: stats.mtime.toISOString(),
        size: stats.size,
        rowCount: lines.length - 1, // Exclude header
      };
    }
  } catch (err) {
    csvInfo = { exists: false, error: err.message };
  }

  res.json({
    syncing: syncInProgress,
    lastSync: lastSyncResult,
    lastSyncTime: lastSyncTime,
    csvFile: csvInfo,
  });
});

/**
 * GET /api/health - Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  log('🚀', `Sync API server running on http://localhost:${PORT}`);
  log('📡', 'Endpoints:');
  log('  ', `  POST http://localhost:${PORT}/api/sync - Trigger sync`);
  log('  ', `  GET  http://localhost:${PORT}/api/sync/status - Get status`);
});