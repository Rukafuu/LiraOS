# LiraOS Deploy Script (PowerShell)
Write-Host "=======================" -ForegroundColor Cyan
Write-Host "LiraOS Deploy Script" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "[ERROR] Not in Chat directory" -ForegroundColor Red
    exit 1
}

Write-Host "[1/5] Checking git status..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "[2/5] Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "[3/5] Creating commit..." -ForegroundColor Yellow
$commitMsg = Read-Host "Enter commit message (or press Enter for default)"

if ([string]::IsNullOrWhiteSpace($commitMsg)) {
    $commitMsg = "fix: gamification serialization + trae mode implementation + deploy configs"
}

git commit -m $commitMsg

Write-Host ""
Write-Host "[4/5] Checking remote..." -ForegroundColor Yellow
git remote -v

Write-Host ""
$confirm = Read-Host "Ready to push to production? (y/n)"

if ($confirm -eq "y" -or $confirm -eq "Y") {
    Write-Host ""
    Write-Host "[5/5] Pushing to main branch..." -ForegroundColor Green
    git push origin main
    
    Write-Host ""
    Write-Host "[SUCCESS] Deploy initiated!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Monitor deployment:" -ForegroundColor Cyan
    Write-Host "  Backend (Railway): https://railway.app/dashboard" -ForegroundColor White
    Write-Host "  Frontend (Vercel): https://vercel.com/dashboard" -ForegroundColor White
    Write-Host ""
    Write-Host "Check logs:" -ForegroundColor Cyan
    Write-Host "  railway logs --follow" -ForegroundColor White
    Write-Host "  vercel logs --follow" -ForegroundColor White
}
else {
    Write-Host "[CANCELLED] Deploy cancelled" -ForegroundColor Red
}
