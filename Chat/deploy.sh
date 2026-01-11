#!/bin/bash

echo "🚀 LiraOS Deploy Script"
echo "======================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in Chat directory"
    exit 1
fi

echo "📋 Step 1: Checking git status..."
git status

echo ""
echo "📦 Step 2: Adding all changes..."
git add .

echo ""
echo "📝 Step 3: Creating commit..."
read -p "Enter commit message (or press Enter for default): " commit_msg

if [ -z "$commit_msg" ]; then
    commit_msg="fix: gamification serialization + trae mode implementation + deploy configs"
fi

git commit -m "$commit_msg"

echo ""
echo "🔍 Step 4: Checking remote..."
git remote -v

echo ""
read -p "🚀 Ready to push to production? (y/n): " confirm

if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
    echo ""
    echo "📤 Pushing to main branch..."
    git push origin main
    
    echo ""
    echo "✅ Deploy initiated!"
    echo ""
    echo "📊 Monitor deployment:"
    echo "  Backend (Railway): https://railway.app/dashboard"
    echo "  Frontend (Vercel): https://vercel.com/dashboard"
    echo ""
    echo "🔍 Check logs:"
    echo "  railway logs --follow"
    echo "  vercel logs --follow"
else
    echo "❌ Deploy cancelled"
fi
