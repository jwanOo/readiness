#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# SAP AI CATALOG SYNC SCRIPT
# Wrapper script for cron job execution
# 
# This script:
# 1. Changes to the project directory
# 2. Runs the Node.js Playwright sync script
# 3. Logs output to a file
#
# Usage:
#   ./scripts/sync-sap-ai-catalog.sh
#
# Cron setup (daily at 15:00 CET):
#   0 15 * * * /path/to/ai-readiness-check/scripts/sync-sap-ai-catalog.sh
# ═══════════════════════════════════════════════════════════════

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Log file
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/sync-$(date +%Y%m%d-%H%M%S).log"

# Ensure logs directory exists
mkdir -p "$LOG_DIR"

# Start logging
echo "═══════════════════════════════════════════════════════════════" >> "$LOG_FILE"
echo "SAP AI Catalog Sync - $(date)" >> "$LOG_FILE"
echo "═══════════════════════════════════════════════════════════════" >> "$LOG_FILE"

# Change to project directory
cd "$PROJECT_DIR" || {
    echo "ERROR: Could not change to project directory: $PROJECT_DIR" >> "$LOG_FILE"
    exit 1
}

echo "Working directory: $(pwd)" >> "$LOG_FILE"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH" >> "$LOG_FILE"
    exit 1
fi

echo "Node.js version: $(node --version)" >> "$LOG_FILE"

# Check if Playwright is installed
if [ ! -d "node_modules/playwright" ]; then
    echo "Installing dependencies..." >> "$LOG_FILE"
    npm install >> "$LOG_FILE" 2>&1
fi

# Run the sync script
echo "" >> "$LOG_FILE"
echo "Starting sync..." >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

node scripts/sync-sap-catalog.js >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

echo "" >> "$LOG_FILE"
echo "═══════════════════════════════════════════════════════════════" >> "$LOG_FILE"

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Sync completed successfully" >> "$LOG_FILE"
else
    echo "❌ Sync failed with exit code: $EXIT_CODE" >> "$LOG_FILE"
fi

echo "Log saved to: $LOG_FILE" >> "$LOG_FILE"
echo "═══════════════════════════════════════════════════════════════" >> "$LOG_FILE"

# Clean up old logs (keep last 30 days)
find "$LOG_DIR" -name "sync-*.log" -mtime +30 -delete 2>/dev/null

exit $EXIT_CODE