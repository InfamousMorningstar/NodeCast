#!/bin/bash
# Fix NodeCast port conflict on TrueNAS
# Run this script on your TrueNAS server

echo "🔧 Fixing NodeCast port conflict..."

# Stop any running containers
echo "Stopping existing containers..."
docker compose down 2>/dev/null || echo "No containers to stop"

# Check what's using port 3000
echo "Checking what's using port 3000..."
netstat -tulpn | grep :3000 || echo "Port 3000 appears to be free now"

# Check what's using port 3069 (our new port)
echo "Checking port 3069 availability..."
netstat -tulpn | grep :3069 || echo "Port 3069 is available"

# Start containers with new configuration
echo "Starting NodeCast on port 3069..."
docker compose --env-file .env.truenas up -d

echo "✅ NodeCast should now be running on port 3069"
echo "🌐 Access it at: http://192.168.1.113:3069"
echo ""
echo "To check status:"
echo "docker compose logs -f app"