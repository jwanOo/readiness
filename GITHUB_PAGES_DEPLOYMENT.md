# 🚀 GitHub Pages Deployment Guide

Complete guide to deploy your SAP AI Readiness Check tool to GitHub Pages with automatic sync.

---

## 📋 Prerequisites

- ✅ GitHub account
- ✅ Git installed locally
- ✅ Node.js installed (v20+)
- ✅ Project already working locally

---

## 🎯 Deployment Overview

### **How It Works**

```
┌──────────────────────────────────────────────────────────────┐
│ LOCAL DEVELOPMENT                                            │
│ - npm run dev                                                │
│ - Click "Sync from SAP" → Runs Python locally               │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ PUSH TO GITHUB                                               │
│ - git push origin main                                       │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ GITHUB ACTIONS (Automatic)                                   │
│ 1. Build workflow → Builds static site                       │
│ 2. Deploy workflow → Publishes to GitHub Pages              │
│ 3. Sync workflow → Runs daily to update SAP data            │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ GITHUB PAGES                                                 │
│ https://jwanOo.github.io/readiness/                          │
│ - Static site (HTML, CSS, JS)                                │
│ - CSV updated daily automatically                            │
│ - "Sync from SAP" button triggers GitHub Actions            │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔧 Step-by-Step Setup

### **Step 1: Initialize Git Repository**

```bash
cd /Users/jwan.sulyman/Documents/my_projects/adesso/ai-readiness-check

# Initialize git (if not already done)
git init

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/

# Build output
dist/

# Environment variables
.env
.env.local

# Logs
logs/
*.log

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Test files
coverage/
EOF

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: SAP AI Readiness Check tool"
```

### **Step 2: Create GitHub Repository**

1. Go to https://github.com/new
2. Repository name: `readiness`
3. Description: "SAP AI Readiness Check Tool"
4. Visibility: **Public** (required for GitHub Pages on free plan)
5. Click "Create repository"

### **Step 3: Push to GitHub**

```bash
# Add remote
git remote add origin https://github.com/jwanOo/readiness.git

# Push to main branch
git branch -M main
git push -u origin main
```

### **Step 4: Enable GitHub Pages**

1. Go to your repository: https://github.com/jwanOo/readiness
2. Click **Settings** tab
3. Click **Pages** in left sidebar
4. Under "Build and deployment":
   - Source: **GitHub Actions** (not "Deploy from a branch")
5. Click **Save**

### **Step 5: Configure Repository Permissions**

For automatic sync to work, workflows need write permissions:

1. Go to **Settings** → **Actions** → **General**
2. Scroll to "Workflow permissions"
3. Select **"Read and write permissions"**
4. Check ✅ "Allow GitHub Actions to create and approve pull requests"
5. Click **Save**

### **Step 6: Verify CSV File Exists**

Make sure the CSV is committed:

```bash
# Check if CSV exists
ls -lh public/sap_ai_data.csv

# If not, run sync locally first
npm run sync-catalog

# Add and commit
git add public/sap_ai_data.csv
git commit -m "Add initial SAP AI catalog data"
git push
```

### **Step 7: Trigger First Deployment**

Push any change to trigger deployment:

```bash
# This will trigger the deploy workflow
git push origin main
```

Or manually trigger from GitHub:
1. Go to **Actions** tab
2. Click "Deploy to GitHub Pages" workflow
3. Click "Run workflow" → "Run workflow"

---

## 🤖 GitHub Actions Workflows

### **1. Deploy to GitHub Pages** (`deploy-github-pages.yml`)

**Triggers:**
- Push to `main` branch
- Manual trigger

**What it does:**
1. Checkout code
2. Install dependencies
3. Build production bundle (`npm run build`)
4. Upload to GitHub Pages
5. Deploy

**Location:** `.github/workflows/deploy-github-pages.yml`

### **2. Sync SAP AI Catalog** (`sync-sap-catalog.yml`)

**Triggers:**
- Daily at 15:00 UTC (3 PM)
- Manual trigger from GitHub UI
- API trigger (from "Sync from SAP" button)

**What it does:**
1. Install Python + Playwright
2. Run `python3 downloader.py`
3. Copy CSV to `public/sap_ai_data.csv`
4. Commit and push changes
5. This triggers re-deployment automatically

**Location:** `.github/workflows/sync-sap-catalog.yml`

---

## 🔄 How Sync Works in Production

### **On GitHub Pages (Production)**

When user clicks "Sync from SAP" button:

```
1. Frontend detects no local server
2. Tries to fetch from GitHub repo (Fallback 1)
3. If that fails, triggers GitHub Actions workflow (Fallback 2)
4. Workflow runs Python downloader
5. Commits updated CSV
6. Push triggers re-deployment
7. Site updates with new data in ~2-3 minutes
```

### **Sync Methods Priority**

```
Method 1: Local Dev Server (Development only)
   ↓ Failed
Method 2: Fetch from GitHub repo (Works immediately)
   ↓ Failed
Method 3: Trigger GitHub Actions (Requires token)
   ↓ Failed
Show error message
```

---

## 🔐 Optional: Enable "Sync from SAP" Button in Production

To allow users to trigger sync from the UI in production:

### **Step 1: Create Personal Access Token**

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name: "AI Readiness Check Sync"
4. Expiration: 90 days (or your preference)
5. Scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
6. Click "Generate token"
7. **Copy the token** (you won't see it again!)

### **Step 2: Add Token to Repository Secrets**

1. Go to your repo: https://github.com/jwanOo/readiness
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click "New repository secret"
4. Name: `WORKFLOW_TRIGGER_TOKEN`
5. Value: Paste your token
6. Click "Add secret"

### **Step 3: Update Environment Variables**

Create `.env.production`:

```bash
cat > .env.production << 'EOF'
VITE_GITHUB_TOKEN=will_be_set_at_build_time
VITE_GITHUB_REPO_OWNER=jwanOo
VITE_GITHUB_REPO_NAME=readiness
EOF
```

Add to `.gitignore`:
```bash
echo ".env.production" >> .gitignore
```

**Note:** For security, tokens should NOT be in frontend code. The current implementation will use the sync fallbacks instead.

---

## 🧪 Testing Deployment

### **Test 1: Check if Site is Live**

```bash
# Wait 2-3 minutes after push, then visit:
open https://jwanOo.github.io/readiness/
```

### **Test 2: Verify Data Loaded**

1. Navigate to AI Catalog
2. Check if use cases are displayed
3. Filter by "AI Agent"
4. Should see 32 agents

### **Test 3: Trigger Manual Sync**

From GitHub UI:
1. Go to **Actions** tab
2. Click "Sync SAP AI Catalog"
3. Click "Run workflow" → "Run workflow"
4. Wait for completion (~30 seconds)
5. Check commit history for new "chore: update SAP AI catalog data"

### **Test 4: Check Automatic Daily Sync**

The workflow runs daily at 15:00 UTC. Check next day:
1. Go to **Actions** tab
2. Look for successful "Sync SAP AI Catalog" run
3. Check latest commit

---

## 📊 Monitoring & Maintenance

### **View Workflow Runs**

1. Go to **Actions** tab
2. See all workflow runs
3. Click on a run to see details
4. Check logs for errors

### **Check Deployment Status**

1. Go to **Settings** → **Pages**
2. See deployment URL and status
3. Click "Visit site"

### **Update Data Manually**

```bash
# Local:
npm run sync-catalog
git add public/sap_ai_data.csv
git commit -m "Update SAP catalog data"
git push

# GitHub will auto-deploy the new data
```

---

## 🔧 Configuration Files

### **package.json**
```json
{
  "homepage": "https://jwanOo.github.io/readiness"
}
```

### **vite.config.js**
```javascript
export default defineConfig({
  base: '/readiness/', // Must match repo name
})
```

### **.github/workflows/deploy-github-pages.yml**
- Builds and deploys on push to main

### **.github/workflows/sync-sap-catalog.yml**
- Syncs data daily + manual trigger

---

## 🐛 Troubleshooting

### **Issue: 404 Page Not Found**

**Cause:** Wrong base path

**Fix:**
1. Check `package.json` → `homepage`
2. Check `vite.config.js` → `base`
3. Both should be `/readiness/`

### **Issue: Sync Workflow Fails**

**Check:**
```bash
# Go to Actions tab → Click failed workflow
# Common issues:
# 1. Python/Playwright not installed → Check workflow logs
# 2. SAP site changed → Update downloader.py selectors
# 3. Network timeout → Increase timeout in downloader.py
```

**Fix:**
1. Check workflow logs for specific error
2. Test locally: `npm run sync-catalog`
3. Update `downloader.py` if needed
4. Push fix

### **Issue: Changes Not Appearing**

**Cause:** Browser cache

**Fix:**
```bash
# Hard reload browser
# Mac: Cmd+Shift+R
# Windows: Ctrl+Shift+R

# Or clear cache
```

### **Issue: Workflow Permissions Denied**

**Fix:**
1. Settings → Actions → General
2. Workflow permissions → "Read and write permissions"
3. Save

---

## 📈 Performance

### **Build Time**
- ~30-60 seconds (depends on dependencies)

### **Deployment Time**
- ~1-2 minutes after build completes

### **Sync Time**
- ~20-30 seconds to download CSV
- ~1-2 minutes to deploy updated data

### **Total Update Time**
- Click sync → 3-4 minutes until live

---

## 🔒 Security Best Practices

### **✅ DO:**
- Use repository secrets for tokens
- Set token expiration
- Use minimal required scopes
- Enable branch protection on main

### **❌ DON'T:**
- Commit tokens to git
- Share tokens in issues/PRs
- Use tokens with `admin` scope
- Disable workflow permissions

---

## 🎯 Production URL

Your app will be available at:

```
https://jwanOo.github.io/readiness/
```

### **Routes:**
- `/` - Home/Dashboard
- `/ai-catalog` - SAP AI Agents Catalog
- `/analytics` - Analytics (if applicable)

---

## 📅 Automated Sync Schedule

The sync runs automatically:
- **Daily:** 15:00 UTC (3 PM)
- **Manual:** Anytime from Actions tab
- **On-Demand:** Via "Sync from SAP" button (if token configured)

---

## 🚀 Deployment Checklist

Before going live:

- [ ] Git repository initialized
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] GitHub Pages enabled (Source: GitHub Actions)
- [ ] Workflow permissions set to "Read and write"
- [ ] Initial CSV file committed
- [ ] Deploy workflow ran successfully
- [ ] Site is accessible at https://jwanOo.github.io/readiness/
- [ ] AI Catalog shows 32 agents
- [ ] Sync workflow tested manually
- [ ] Daily sync scheduled

---

## 📞 Support

### **Quick Checks**
```bash
# Test build locally
npm run build

# Preview production build
npm run preview
# Visit: http://localhost:4173/readiness/

# Test sync
npm run sync-catalog

# Check GitHub Actions
# Go to: https://github.com/jwanOo/readiness/actions
```

### **Common Commands**
```bash
# Deploy latest changes
git add .
git commit -m "Update: description"
git push origin main

# Trigger sync manually
# Go to Actions → Sync SAP AI Catalog → Run workflow

# View logs
# Go to Actions → Click workflow run → View logs
```

---

## 🎉 Success Indicators

You know it's working when:

1. ✅ Site loads at https://jwanOo.github.io/readiness/
2. ✅ AI Catalog shows 371 use cases
3. ✅ Filter "AI Agent" → 32 results
4. ✅ "Sync from SAP" button shows appropriate message
5. ✅ GitHub Actions runs daily at 15:00 UTC
6. ✅ New commits appear with "chore: update SAP AI catalog data"

---

**Last Updated:** 2026-03-12
**Status:** ✅ Ready for deployment
**Estimated Setup Time:** 15-20 minutes
