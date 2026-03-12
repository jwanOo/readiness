/**
 * Vite Plugin: SAP AI Catalog Sync
 * Adds /api/sync endpoint to Vite dev server
 * This allows the "Sync from SAP" button to work with just `npm run dev`
 */
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let syncInProgress = false;
let lastSyncResult = null;
let lastSyncTime = null;

function log(emoji, message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${emoji} ${message}`);
}

export default function sapSyncPlugin() {
  return {
    name: 'sap-sync-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Handle both /api/sync and /ai-readiness-check/api/sync
        const url = req.url || '';

        // Handle POST /api/sync - Trigger sync
        if (req.method === 'POST' && (url === '/api/sync' || url.endsWith('/api/sync'))) {
          if (syncInProgress) {
            res.statusCode = 409;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: false,
              error: 'Sync already in progress',
              status: 'SYNCING',
            }));
            return;
          }

          log('🚀', 'Manual sync triggered from UI');
          syncInProgress = true;
          lastSyncResult = null;

          // Send immediate response
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            success: true,
            message: 'Sync started',
            status: 'SYNCING',
          }));

          // Run sync in background
          const scriptPath = path.join(__dirname, 'scripts', 'sync-sap-catalog.js');

          try {
            const syncProcess = spawn('node', [scriptPath], {
              cwd: __dirname,
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
                // Parse output to get row count
                const rowMatch = output.match(/Total SAP AI use cases: (\d+)/);
                const agentMatch = output.match(/AI Agents: (\d+)/);
                const featureMatch = output.match(/AI Features: (\d+)/);

                lastSyncResult = {
                  success: true,
                  message: 'Sync completed successfully',
                  output: output,
                  rowCount: rowMatch ? parseInt(rowMatch[1]) : null,
                  agentCount: agentMatch ? parseInt(agentMatch[1]) : null,
                  featureCount: featureMatch ? parseInt(featureMatch[1]) : null,
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

          return;
        }

        // Handle GET /api/sync/status - Get sync status
        if (req.method === 'GET' && (url === '/api/sync/status' || url.endsWith('/api/sync/status'))) {
          // Check if CSV file exists and get its info
          const csvPath = path.join(__dirname, 'public', 'sap_ai_data.csv');
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

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            syncing: syncInProgress,
            lastSync: lastSyncResult,
            lastSyncTime: lastSyncTime,
            csvFile: csvInfo,
          }));
          return;
        }

        next();
      });

      // Health check endpoint
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        if (req.method === 'GET' && (url === '/api/health' || url.endsWith('/api/health'))) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            status: 'ok',
            timestamp: new Date().toISOString(),
            syncAvailable: true,
          }));
          return;
        }
        next();
      });

      log('🔌', 'SAP Sync plugin loaded - /api/sync endpoint available');
    },
  };
}
