#!/bin/bash
# NodeCast Deployment Verification Script
# Run this after deployment to verify everything is working

echo "🔍 NodeCast Deployment Verification"
echo "=================================="
echo ""

# Check if we're on the right system
echo "📍 System Information:"
echo "Hostname: $(hostname)"
echo "IP Address: $(ip route get 8.8.8.8 | awk '{print $7}' | head -1)"
echo ""

# Check ZFS datasets
echo "💾 ZFS Dataset Status:"
if command -v zfs &> /dev/null; then
    echo "✅ ZFS available"
    
    # Check app-pool datasets
    echo ""
    echo "🚀 SSD Pool (app-pool) datasets:"
    for dataset in postgresql redis config themes; do
        if zfs list app-pool/nodecast/$dataset &>/dev/null; then
            echo "✅ app-pool/nodecast/$dataset - EXISTS"
        else
            echo "❌ app-pool/nodecast/$dataset - MISSING"
        fi
    done
    
    # Check Centauri datasets  
    echo ""
    echo "💾 HDD Pool (Centauri) datasets:"
    for dataset in uploads temp public; do
        if zfs list Centauri/nodecast/$dataset &>/dev/null; then
            echo "✅ Centauri/nodecast/$dataset - EXISTS"
        else
            echo "❌ Centauri/nodecast/$dataset - MISSING"
        fi
    done
else
    echo "❌ ZFS not available"
fi

echo ""

# Check mount points
echo "📁 Mount Point Status:"
for path in /mnt/app-pool/nodecast/postgresql /mnt/app-pool/nodecast/redis /mnt/app-pool/nodecast/config /mnt/app-pool/nodecast/themes /mnt/Centauri/nodecast/uploads /mnt/Centauri/nodecast/temp /mnt/Centauri/nodecast/public; do
    if [ -d "$path" ]; then
        owner=$(stat -c '%U:%G' "$path")
        perms=$(stat -c '%a' "$path")
        echo "✅ $path - Owner: $owner, Permissions: $perms"
    else
        echo "❌ $path - MISSING"
    fi
done

echo ""

# Check Docker
echo "🐳 Docker Status:"
if command -v docker &> /dev/null; then
    echo "✅ Docker available"
    
    # Check if NodeCast image exists
    if docker images | grep -q "nodecast.*local"; then
        echo "✅ NodeCast image (nodecast:local) - EXISTS"
    else
        echo "❌ NodeCast image (nodecast:local) - MISSING"
    fi
    
    # Check running containers
    echo ""
    echo "📦 Container Status:"
    for container in nodecast-app nodecast-postgres nodecast-redis; do
        if docker ps | grep -q "$container"; then
            status=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep "$container" | awk '{print $2}')
            echo "✅ $container - RUNNING ($status)"
        else
            echo "❌ $container - NOT RUNNING"
        fi
    done
else
    echo "❌ Docker not available"
fi

echo ""

# Check network connectivity
echo "🌐 Network Connectivity:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/healthcheck | grep -q "200"; then
    echo "✅ NodeCast web interface - RESPONDING"
else
    echo "❌ NodeCast web interface - NOT RESPONDING"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:5432 2>/dev/null; then
    echo "✅ PostgreSQL - ACCESSIBLE"
else
    echo "❌ PostgreSQL - NOT ACCESSIBLE"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:6379 2>/dev/null; then
    echo "✅ Redis - ACCESSIBLE" 
else
    echo "❌ Redis - NOT ACCESSIBLE"
fi

echo ""

# Check user/permissions
echo "👤 User & Permission Status:"
if id 568 &>/dev/null; then
    user_info=$(id 568)
    echo "✅ User 568 exists: $user_info"
else
    echo "❌ User 568 does not exist"
fi

echo ""

# Final status
echo "🎯 Quick Access URLs:"
echo "Web Interface: http://192.168.1.113:3000"
echo "Health Check:  http://192.168.1.113:3000/api/healthcheck"
echo ""

echo "✅ Verification complete!"
echo ""
echo "🚀 If all items show ✅, your NodeCast deployment is ready!"
echo "❌ If any items show ❌, check the deployment guide for troubleshooting."