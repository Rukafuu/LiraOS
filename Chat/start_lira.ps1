# LiraOS Launcher PowerShell
Set-Location $PSScriptRoot

Write-Host "LiraOS Launch sequence..." -ForegroundColor Cyan

# Kill old processes
Write-Host "Cleaning up..."
Stop-Process -Name "node" -ErrorAction SilentlyContinue
Stop-Process -Name "python" -ErrorAction SilentlyContinue

# Start Python
Write-Host "Starting Python Bridge..."
Start-Process cmd -ArgumentList "/k cd backend\python && python game_bridge.py"

# Start Backend
Write-Host "Starting Backend..."
Start-Process cmd -ArgumentList "/k cd backend && npm run dev"

# Start Frontend
Write-Host "Starting Frontend..."
Start-Process cmd -ArgumentList "/k npm run dev"

# Wait
Start-Sleep -Seconds 5

# Open Browser
Write-Host "Launching Browser..."
Start-Process "http://localhost:5173/gamer/?debug_auth=true"

Write-Host "Done! You can close this window." -ForegroundColor Green
Read-Host "Press Enter to exit"
