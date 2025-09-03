#!/bin/bash

echo "🔄 Restarting Tennis Club RT2 Backend Server..."

# Kill any existing backend processes
echo "🛑 Stopping existing backend processes..."
pkill -f "nodemon" 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "⏳ Waiting for processes to stop..."
sleep 2

echo "🚀 Starting backend server with updated CORS configuration..."
cd backend

npm run dev