#!/bin/bash

echo "🔍 Testing Backend Connectivity..."
echo ""

# Test /health endpoint
echo "📡 Testing /health endpoint..."
curl -s http://localhost:3000/health | jq '.' 2>/dev/null || curl -s http://localhost:3000/health || echo "❌ /health endpoint failed"

echo ""

# Test /api/health endpoint  
echo "📡 Testing /api/health endpoint..."
curl -s http://localhost:3000/api/health | jq '.' 2>/dev/null || curl -s http://localhost:3000/api/health || echo "❌ /api/health endpoint failed"

echo ""

# Test reservations endpoint
echo "📡 Testing /api/reservations/my-upcoming endpoint..."
curl -s -H "Authorization: Bearer test-token" http://localhost:3000/api/reservations/my-upcoming || echo "❌ Reservations endpoint failed (expected - needs auth)"

echo ""
echo "✅ Connectivity test complete!"