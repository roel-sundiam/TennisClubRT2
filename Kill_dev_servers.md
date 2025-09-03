# Kill Development Servers Guide

This guide provides various methods to stop development servers and Node.js processes during development.

## 🔍 Check What's Running First

Before killing processes, it's good practice to see what's currently running:

```bash
# See all development processes
ps aux | grep -E "(ng serve|npm.*dev|node.*serve)" | grep -v grep

# Check specific ports
lsof -i :3000    # Backend server
lsof -i :4200    # Angular dev server (default)
lsof -i :4201    # Angular dev server (alternative)

# See all Node processes
ps aux | grep node | grep -v grep
```

## 🎯 Kill by Process Name

### Angular Development Server
```bash
# Kill Angular dev servers specifically
pkill -f "ng serve"

# Kill with signal (more forceful)
pkill -9 -f "ng serve"
```

### NPM Development Processes
```bash
# Kill npm dev processes
pkill -f "npm run dev"

# Kill any npm processes
pkill -f "npm"
```

### Node.js Processes
```bash
# Kill specific Node.js development processes
pkill -f "node.*serve"
pkill -f "node.*dev"

# Kill ALL Node.js processes (⚠️ Use with caution)
pkill node
```

## 🔌 Kill by Port

### Single Port
```bash
# Kill process on specific port
kill -9 $(lsof -t -i:3000)     # Backend
kill -9 $(lsof -t -i:4200)     # Frontend (default)
kill -9 $(lsof -t -i:4201)     # Frontend (alternative)
```

### Multiple Ports
```bash
# Kill multiple ports at once
kill -9 $(lsof -t -i:3000,4200,4201)

# Or individually with error handling
for port in 3000 4200 4201; do
  pid=$(lsof -t -i:$port)
  if [ ! -z "$pid" ]; then
    kill -9 $pid
    echo "Killed process on port $port (PID: $pid)"
  fi
done
```

## 🚀 Tennis Club RT2 Specific Commands

### Kill All Development Servers
```bash
# Comprehensive kill for our project
pkill -f "ng serve" && pkill -f "npm run dev" && pkill -f "node.*serve"
```

### Kill by Project Ports
```bash
# Kill our specific ports
kill -9 $(lsof -t -i:3000,4200,4201) 2>/dev/null
```

### Safe Development Server Restart
```bash
# Clean kill and restart
pkill -f "ng serve" && pkill -f "npm run dev"
sleep 2
cd /path/to/TennisClubRT2 && npm run dev
```

## 🔧 Advanced Methods

### Kill with Grace Period
```bash
# Send TERM signal first (graceful)
pkill -TERM -f "ng serve"
sleep 5
# Then force kill if still running
pkill -9 -f "ng serve"
```

### Kill Entire Process Tree
```bash
# Kill process and all its children
pkill -f -TERM "ng serve"
```

### Find and Kill by PID
```bash
# Find the PID first
PID=$(pgrep -f "ng serve")
echo "Angular dev server PID: $PID"

# Kill by PID
kill -9 $PID
```

## ⚠️ Safety Tips

### Check Before Nuclear Option
```bash
# Always check what you're about to kill
ps aux | grep node

# Count Node processes
ps aux | grep node | wc -l
```

### Safe Patterns
```bash
# ✅ Safe - kills only development servers
pkill -f "ng serve"
pkill -f "npm run dev"

# ⚠️ Caution - kills all npm processes
pkill npm

# 🚨 Dangerous - kills ALL Node.js processes
pkill node
```

## 📋 Quick Reference Commands

| Purpose | Command |
|---------|---------|
| Kill Angular dev server | `pkill -f "ng serve"` |
| Kill npm dev processes | `pkill -f "npm run dev"` |
| Kill by port 4200 | `kill -9 $(lsof -t -i:4200)` |
| Kill by port 3000 | `kill -9 $(lsof -t -i:3000)` |
| Kill Tennis Club ports | `kill -9 $(lsof -t -i:3000,4200,4201)` |
| Check what's running | `ps aux \| grep -E "(ng serve\|npm.*dev)" \| grep -v grep` |
| Nuclear option | `pkill node` ⚠️ |

## 🔄 Restart Development Environment

After killing servers, restart with:

```bash
# From project root
npm run dev

# Or individually
cd backend && npm run dev &
cd frontend && ng serve --port 4201 &
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find what's using the port
lsof -i :4200
netstat -tulpn | grep :4200

# Kill the specific process
kill -9 $(lsof -t -i:4200)
```

### Process Won't Die
```bash
# Try different signals
kill -TERM <PID>    # Graceful termination
kill -KILL <PID>    # Force kill
kill -9 <PID>       # Force kill (same as KILL)
```

### Check if Process is Really Dead
```bash
# Verify process is killed
ps aux | grep <PID>

# Wait and check again
sleep 2 && ps aux | grep "ng serve"
```

---

## 🪟 Windows PowerShell Commands

For Windows users working with PowerShell:

### 🔍 Check What's Running
```powershell
# Check processes by name
Get-Process | Where-Object {$_.ProcessName -like "*node*"}
Get-Process | Where-Object {$_.ProcessName -like "*ng*"}

# Check what's using specific ports
netstat -ano | findstr :3000
netstat -ano | findstr :4200
netstat -ano | findstr :4201

# More detailed process info
Get-NetTCPConnection -LocalPort 3000 | Select-Object LocalAddress,LocalPort,State,OwningProcess
Get-NetTCPConnection -LocalPort 4200 | Select-Object LocalAddress,LocalPort,State,OwningProcess
```

### 🎯 Kill by Process Name
```powershell
# Kill specific development processes
taskkill /f /im node.exe
taskkill /f /im ng.exe

# Kill processes with pattern matching
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
Get-Process | Where-Object {$_.MainWindowTitle -like "*ng serve*"} | Stop-Process -Force
```

### 🔌 Kill by Port
```powershell
# Kill process on specific port (replace 3000 with your port)
$port = 3000
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($process) {
    Stop-Process -Id $process.OwningProcess -Force
    Write-Host "Killed process on port $port"
} else {
    Write-Host "No process found on port $port"
}

# Kill multiple ports
@(3000, 4200, 4201) | ForEach-Object {
    $port = $_
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $process.OwningProcess -Force
        Write-Host "Killed process on port $port"
    }
}
```

### 🚀 Tennis Club RT2 Specific PowerShell Commands
```powershell
# Kill all development servers for Tennis Club RT2
function Kill-TennisClubServers {
    # Kill by process name
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    
    # Kill by ports
    @(3000, 4200, 4201) | ForEach-Object {
        $process = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue
        if ($process) {
            Stop-Process -Id $process.OwningProcess -Force
            Write-Host "Killed process on port $_"
        }
    }
    Write-Host "Tennis Club RT2 development servers stopped"
}

# Usage: just run Kill-TennisClubServers
```

### 🔧 Advanced PowerShell Methods
```powershell
# Kill with confirmation
Get-Process -Name "node" | ForEach-Object {
    Write-Host "Found Node.js process: $($_.Id) - $($_.ProcessName)"
    $confirm = Read-Host "Kill this process? (y/n)"
    if ($confirm -eq 'y') {
        Stop-Process -Id $_.Id -Force
    }
}

# Safe restart function
function Restart-TennisClubDev {
    Kill-TennisClubServers
    Start-Sleep -Seconds 3
    Set-Location "C:\Projects2\TennisClubRT2"  # Adjust path as needed
    npm run dev
}
```

### ⚠️ PowerShell Safety Tips
```powershell
# Always check what you're killing first
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Format-Table Id,ProcessName,StartTime

# Count processes before nuclear option
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
Write-Host "Found $($nodeProcesses.Count) Node.js processes"
```

### 📋 PowerShell Quick Reference

| Purpose | PowerShell Command |
|---------|-------------------|
| List Node processes | `Get-Process -Name "node"` |
| Kill all Node processes | `Get-Process -Name "node" \| Stop-Process -Force` |
| Check port 3000 | `Get-NetTCPConnection -LocalPort 3000` |
| Kill by port | `Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force` |
| Task Manager | `taskmgr` |
| Process list with ports | `netstat -ano` |

---

## 📝 Notes

- Always check what's running before killing processes
- Use specific process names instead of `pkill node` when possible
- Development servers usually restart automatically when files change
- If a port shows as "in use" after killing, wait a few seconds for the OS to release it
- On Windows, use Task Manager or `taskkill` commands instead (see Windows PowerShell section below)

## 🔗 Related Files

- `CLAUDE.md` - Development environment setup
- `package.json` - Available npm scripts
- `README.md` - Project documentation