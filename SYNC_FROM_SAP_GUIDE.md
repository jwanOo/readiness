# 🔄 SAP AI Agents Sync - Complete Guide

## ✅ Status: WORKING

The "Sync from SAP" button now successfully downloads AI Agents from:
**https://discovery-center.cloud.sap/ai-catalog/**

### Latest Sync Results
- ✅ **371 total use cases** downloaded
- ✅ **32 AI Agents** identified
- ✅ **339 AI Features** identified
- ✅ Data saved to `public/sap_ai_data.csv`

---

## 🎯 How It Works

### Architecture

```
User clicks "Sync from SAP" button
    ↓
Frontend calls triggerSync() API
    ↓
3 Fallback Methods (in order):
    ↓
1️⃣ Local API Server (localhost:3001)
   - Runs sync-api-server.js
   - Spawns sync-sap-catalog.js
   - Uses Python downloader (Playwright)
   - Downloads from SAP Discovery Center
    ↓
2️⃣ GitHub Repository Fetch
   - Fetches latest CSV from GitHub repo
   - Updates local cache
    ↓
3️⃣ GitHub Actions Workflow
   - Triggers workflow via GitHub API
   - Requires VITE_GITHUB_TOKEN
    ↓
CSV saved to public/sap_ai_data.csv
    ↓
Frontend reloads data
    ↓
Agents displayed in catalog
```

### Python Downloader Flow

1. **Launch Playwright Browser** - Headless Chromium
2. **Navigate to SAP** - `https://discovery-center.cloud.sap/ai-catalog/`
3. **Handle Cookie Consent** - Clicks TrustArc consent button
4. **Wait for Table** - 15 seconds for data to load
5. **Find Download Button** - Multiple selectors for reliability
6. **Click Download** - Downloads CSV file
7. **Save to Disk** - `Agents Discovery/sap_ai_raw_data.csv`
8. **Copy to Public** - `public/sap_ai_data.csv`

---

## 🚀 Usage

### Method 1: Via UI (Recommended)

1. **Start the development servers**:
   ```bash
   npm run dev:all
   ```
   This starts:
   - Vite dev server (port 5173)
   - Sync API server (port 3001)

2. **Open the app**:
   - Navigate to `http://localhost:5173/ai-catalog`

3. **Click "Sync from SAP" button**:
   - Wait 20-30 seconds for download
   - You'll see progress indicators
   - Success message shows agent/feature counts

4. **Filter by AI Agents**:
   - Select "AI Agent" from "AI Type" dropdown
   - See all 32 AI Agents

### Method 2: Via Command Line

```bash
# Run sync script directly
npm run sync-catalog

# Or with node
node scripts/sync-sap-catalog.js

# Or with Python directly
cd "Agents Discovery"
python3 downloader.py
```

### Method 3: Via API

```bash
# Start sync server
npm run sync-server

# Trigger sync
curl -X POST http://localhost:3001/api/sync

# Check status
curl http://localhost:3001/api/sync/status
```

---

## 📁 File Structure

```
ai-readiness-check/
├── public/
│   └── sap_ai_data.csv           # ← Final CSV used by app
├── Agents Discovery/
│   ├── downloader.py              # ← Python Playwright scraper
│   ├── sap_ai_raw_data.csv        # ← Downloaded raw CSV
│   └── sap_ai_config.json         # ← Scheduler config
├── scripts/
│   ├── sync-sap-catalog.js        # ← Main sync script (calls Python)
│   └── sync-api-server.js         # ← Express API server
└── src/
    └── lib/
        └── sapAICatalogService.js # ← Frontend service
```

---

## 🔧 Configuration

### Environment Variables

Create `.env` file (optional):
```bash
# Sync API server port (default: 3001)
VITE_SYNC_API_URL=http://localhost:3001

# GitHub repository (for fallback sync)
VITE_GITHUB_REPO_OWNER=jwanOo
VITE_GITHUB_REPO_NAME=readiness

# GitHub token (for workflow trigger)
VITE_GITHUB_TOKEN=ghp_your_token_here
```

### Sync Configuration

In `scripts/sync-sap-catalog.js`:
```javascript
const CONFIG = {
  url: 'https://discovery-center.cloud.sap/ai-catalog/',
  outputPath: path.join(__dirname, '..', 'public', 'sap_ai_data.csv'),
  timeout: 90000,        // 90 seconds
  waitTime: 15000,       // 15 seconds for table load
  retries: 3,            // Number of retry attempts
  screenshotOnError: true,
  screenshotPath: path.join(__dirname, '..', 'logs', 'sap_debug_screenshot.png'),
};
```

---

## 🧪 Testing

### Test 1: Verify Python Downloader

```bash
cd "Agents Discovery"
python3 downloader.py
```

**Expected Output:**
```
🚀 Starte Browser (Unsichtbarer Headless-Modus)...
🌍 Navigiere zum SAP AI Catalog...
🍪 Entferne Cookie-Layer...
⌛ Warte 15 Sekunden, bis die SAP-Tabelle stabil ist...
🔍 Suche Download-Knopf...
🖱️ Starte Download-Versuch...
✅ ERFOLG! Datei gespeichert: .../sap_ai_raw_data.csv
🚪 Schließe Browser...
```

### Test 2: Verify Sync Script

```bash
npm run sync-catalog
```

**Expected Output:**
```
[timestamp] 🚀 Starting SAP AI Catalog sync...
[timestamp] 🐍 Using Python downloader for reliability...
[timestamp] 🔄 Running Python downloader...
[timestamp] ✅ Python downloader completed successfully
[timestamp] 📋 Copied CSV to: .../public/sap_ai_data.csv
[timestamp] 📊 File size: 109.52 KB
[timestamp] 📈 Total SAP AI use cases: 371
[timestamp] 🤖 AI Agents: 32
[timestamp] ✨ AI Features: 339
[timestamp] 🎉 Sync completed successfully!
```

### Test 3: Verify API Server

```bash
# Terminal 1: Start server
npm run sync-server

# Terminal 2: Test endpoints
curl http://localhost:3001/api/health
# Expected: {"status":"ok","timestamp":"..."}

curl -X POST http://localhost:3001/api/sync
# Expected: {"success":true,"message":"Sync started","status":"SYNCING"}

# Wait 30 seconds, then:
curl http://localhost:3001/api/sync/status
# Expected: JSON with sync results and CSV info
```

### Test 4: Verify UI Integration

1. Start dev servers: `npm run dev:all`
2. Open: `http://localhost:5173/ai-catalog`
3. Click "🔄 Sync from SAP" button
4. Wait for progress messages
5. Verify success message: "✅ 371 use cases loaded from GitHub" or similar
6. Select "AI Agent" filter
7. Verify 32 agents are displayed

### Test 5: Verify CSV Data

```bash
# Count total rows
wc -l public/sap_ai_data.csv
# Expected: 372 (1 header + 371 data rows)

# Count AI Agents
grep -c "AI Agent" public/sap_ai_data.csv
# Expected: 32

# Show sample agents
grep "AI Agent" public/sap_ai_data.csv | head -3
```

---

## 🐛 Troubleshooting

### Issue 1: "Sync server offline" warning

**Symptom:** ⚠️ warning appears next to sync button

**Solution:**
```bash
# Start the sync server
npm run sync-server

# Or run both together
npm run dev:all
```

### Issue 2: "Sync failed. Start the server with: npm run dev:all"

**Cause:** Local sync server not running, GitHub fetch failed

**Solution:**
```bash
# Option 1: Start both servers
npm run dev:all

# Option 2: Use manual sync
npm run sync-catalog
# Then reload the page
```

### Issue 3: Python script fails

**Error:** `Python downloader failed with exit code 1`

**Diagnostic:**
```bash
# Check Python and Playwright
python3 --version
python3 -c "import playwright"

# If Playwright missing:
python3 -m pip install playwright
python3 -m playwright install chromium
```

### Issue 4: No agents showing after sync

**Diagnostic:**
```bash
# 1. Verify CSV exists and has data
ls -lh public/sap_ai_data.csv
grep -c "AI Agent" public/sap_ai_data.csv

# 2. Check browser console (F12)
# Look for errors or warnings

# 3. Clear browser cache
# Hard reload: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# 4. Verify filter is set correctly
# In browser console:
console.log(filters.aiType);
# Should be "AI Agent"
```

### Issue 5: Download button not found

**Error:** `Download button not found`

**Cause:** SAP website structure changed

**Solution:**
1. Take screenshot: Check `logs/sap_debug_screenshot.png`
2. Update selectors in `downloader.py` line 45:
   ```python
   download_btn = page.locator('button[title="Download"]').first
   ```
3. Check SAP Discovery Center UI for new button selector

---

## 📊 Data Structure

### CSV Format

```csv
Name,AI Type,Commercial Type,Product,Description,Product Category,Package,Quick Filters,Availability,Identifier,Detail Page
"Accounting Accruals Agent","AI Agent","","","Automate journal entry...","Cloud ERP applications","","Joule","Beta","J787","https://..."
```

### Parsed Object Structure

```javascript
{
  id: "J787",
  identifier: "J787",
  name: "Accounting Accruals Agent",
  ai_type: "AI Agent",
  commercial_type: "",
  product: "",
  description: "Automate journal entry preparation for manual accruals.",
  product_category: "Cloud ERP applications",
  package: "",
  quick_filters: "Joule",
  availability: "Beta",
  url: "https://discovery-center.cloud.sap/ai-feature/..."
}
```

---

## 🔐 Security Notes

### API Security
- Sync API server runs locally (localhost:3001)
- No authentication required for local dev
- CORS enabled for frontend access

### GitHub Token
- Only needed for GitHub Actions workflow trigger
- Store in `.env` file (git-ignored)
- Never commit tokens to repository

### Data Privacy
- All data is public from SAP Discovery Center
- No customer or sensitive data downloaded
- CSV contains only SAP product information

---

## 📅 Sync Schedule

### Manual Sync
- Click button in UI anytime
- Recommended: Before important presentations
- Data updates in real-time from SAP

### Automated Sync (Optional)
You can set up cron job or GitHub Actions:

**Cron Example** (daily at 3 PM):
```bash
crontab -e
# Add:
0 15 * * * cd /path/to/project && npm run sync-catalog
```

**GitHub Actions** (see `.github/workflows/sync-sap-catalog.yml`)

---

## 🎓 How to Filter Agents

### In the UI

1. Navigate to AI Catalog: `/ai-catalog`
2. Use the "AI Type" dropdown
3. Select "AI Agent"
4. See 32 AI Agents filtered

### Programmatically

```javascript
import { fetchUseCases } from './lib/sapAICatalogService';

// Get all AI Agents
const agents = await fetchUseCases({ aiType: 'AI Agent' });
console.log(`Found ${agents.length} AI Agents`);

// Get AI Agents by category
const financeAgents = await fetchUseCases({
  aiType: 'AI Agent',
  productCategory: 'Financial Management'
});

// Get generally available AI Agents
const gaAgents = await fetchUseCases({
  aiType: 'AI Agent',
  availability: 'Generally Available'
});
```

---

## 📈 Statistics

### Latest Sync (2026-03-12)
- **Total Use Cases:** 371
- **AI Agents:** 32 (8.6%)
- **AI Features:** 339 (91.4%)
- **File Size:** 109.52 KB
- **Download Time:** ~23 seconds

### AI Agents by Availability
- Generally Available: ~15
- Beta: ~17
- Early Adopter Care: ~0

### AI Agents by Commercial Type
- Base (Included): ~3
- Premium: ~2
- Not Specified: ~27

---

## 🚨 Known Issues

### Issue: Case-sensitive filtering
**Status:** Resolved
**Fix:** All comparisons use exact string match

### Issue: Cache persistence
**Status:** By design
**Behavior:** 5-minute cache for performance
**Override:** Reload page or wait for cache expiry

### Issue: Database fallback
**Status:** Working as intended
**Behavior:** Tries database first, falls back to CSV if database unavailable

---

## 🆘 Support Checklist

If sync is not working:

- [ ] Python 3 installed? `python3 --version`
- [ ] Playwright installed? `python3 -c "import playwright"`
- [ ] Chromium installed? `python3 -m playwright install chromium`
- [ ] Sync server running? `curl http://localhost:3001/api/health`
- [ ] CSV file exists? `ls -lh public/sap_ai_data.csv`
- [ ] CSV has agents? `grep -c "AI Agent" public/sap_ai_data.csv`
- [ ] Port 3001 available? `lsof -i :3001`
- [ ] Internet connection? `ping discovery-center.cloud.sap`
- [ ] Browser cache cleared? Hard reload page

---

## 🎉 Success Indicators

You know it's working when you see:

✅ "Sync from SAP" button appears (not grayed out)
✅ No "⚠️ Server offline" warning
✅ Click button → "🔄 Synchronisiere..." appears
✅ After ~30 seconds → "✅ 371 use cases loaded" message
✅ Select "AI Agent" filter → 32 results shown
✅ Each agent card shows: 🤖 icon, identifier (J###), name, description

---

## 📞 Contact

For issues or questions:
1. Check this guide first
2. Review `logs/` folder for error screenshots
3. Check browser console (F12) for JavaScript errors
4. Check terminal output for server errors

---

**Last Updated:** 2026-03-12
**Version:** 1.0.0
**Sync Method:** Python Playwright Downloader
