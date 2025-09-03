#!/bin/bash

echo "🚀 Starting Tennis Club RT2 Backend Server..."

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Error: backend directory not found!"
    echo "📁 Please run this script from the project root directory"
    exit 1
fi

echo "📂 Changing to backend directory..."
cd backend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in backend directory!"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found! Using defaults..."
    echo "💡 Copy .env.example to .env and configure if needed"
fi

# Kill any existing processes on port 3000
echo "🧹 Clearing port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "📦 Installing/updating dependencies..."
npm install

echo "🔥 Starting development server..."
echo "📡 Server will be available at: http://localhost:3000"
echo "🔗 Health check: http://localhost:3000/health"
echo ""
echo "✅ Look for: '🚀 Tennis Club RT2 Backend running on port 3000'"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

npm run dev