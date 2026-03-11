#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Security Remediation Script
# Removes exposed API key from git history and deploys secure solution
# ═══════════════════════════════════════════════════════════════

set -e

echo "🔐 AI Readiness Check - Security Remediation"
echo "============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "supabase" ]; then
    echo -e "${RED}Error: Please run this script from the ai-readiness-check project root${NC}"
    exit 1
fi

echo "📋 This script will:"
echo "   1. Deploy the secure Edge Function to Supabase"
echo "   2. Set the API key as a Supabase secret"
echo "   3. Remove the exposed API key from git history"
echo "   4. Force push the cleaned history"
echo ""
echo -e "${YELLOW}⚠️  WARNING: This will rewrite git history!${NC}"
echo "   All collaborators will need to re-clone the repository."
echo ""
read -p "Do you want to continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Step 1: Check Supabase CLI
echo ""
echo "Step 1: Checking Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}Supabase CLI not found. Installing...${NC}"
    npm install -g supabase
fi
echo -e "${GREEN}✓ Supabase CLI available${NC}"

# Step 2: Login to Supabase
echo ""
echo "Step 2: Logging into Supabase..."
supabase login || true

# Step 3: Link project
echo ""
echo "Step 3: Linking Supabase project..."
read -p "Enter your Supabase project ref (e.g., fcpceywaszttgwdwirao): " PROJECT_REF
supabase link --project-ref "$PROJECT_REF"
echo -e "${GREEN}✓ Project linked${NC}"

# Step 4: Set the API key secret
echo ""
echo "Step 4: Setting API key as Supabase secret..."
echo -e "${YELLOW}Enter your NEW adesso AI Hub API key (the old one is compromised):${NC}"
read -s API_KEY
echo ""
supabase secrets set ADESSO_AI_HUB_API_KEY="$API_KEY"
echo -e "${GREEN}✓ API key stored in Supabase secrets${NC}"

# Step 5: Deploy Edge Function
echo ""
echo "Step 5: Deploying Edge Function..."
supabase functions deploy ai-proxy
echo -e "${GREEN}✓ Edge Function deployed${NC}"

# Step 6: Verify deployment
echo ""
echo "Step 6: Verifying deployment..."
supabase functions list
echo ""

# Step 7: Clean git history
echo ""
echo "Step 7: Cleaning git history..."
echo -e "${YELLOW}This will remove the exposed API key from all commits.${NC}"
read -p "Continue with git history cleanup? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # The old exposed API key
    OLD_KEY="sk-ccwu3ZNJMFCfQG76gRaGjg"
    
    # Check if BFG is available, otherwise use git filter-branch
    if command -v bfg &> /dev/null; then
        echo "Using BFG Repo-Cleaner..."
        echo "$OLD_KEY" > /tmp/passwords.txt
        bfg --replace-text /tmp/passwords.txt
        rm /tmp/passwords.txt
    else
        echo "Using git filter-branch (this may take a while)..."
        git filter-branch --force --tree-filter "
            find . -type f -name '*.js' -o -name '*.ts' -o -name '*.json' | xargs -I {} sed -i '' 's/$OLD_KEY/REDACTED_API_KEY/g' {} 2>/dev/null || true
        " --prune-empty HEAD
    fi
    
    # Clean up refs
    git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
    
    echo -e "${GREEN}✓ Git history cleaned${NC}"
    
    # Step 8: Force push
    echo ""
    echo "Step 8: Force pushing cleaned history..."
    echo -e "${YELLOW}⚠️  This will overwrite the remote repository!${NC}"
    read -p "Force push to origin? (y/N) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push origin --force --all
        git push origin --force --tags
        echo -e "${GREEN}✓ Remote repository updated${NC}"
    else
        echo "Skipped force push. Run manually: git push origin --force --all"
    fi
fi

# Step 9: Rebuild and deploy frontend
echo ""
echo "Step 9: Rebuilding and deploying frontend..."
npm run build
npm run deploy
echo -e "${GREEN}✓ Frontend deployed to GitHub Pages${NC}"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}🎉 Security remediation complete!${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Notify all collaborators to re-clone the repository"
echo "  2. Rotate the API key in adesso AI Hub (the old one is compromised)"
echo "  3. Test the application to ensure AI features work"
echo ""
echo "Test the Edge Function:"
echo "  curl -X POST '${VITE_SUPABASE_URL}/functions/v1/ai-proxy' \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}'"
echo ""