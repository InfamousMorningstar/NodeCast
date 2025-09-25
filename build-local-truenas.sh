#!/bin/bash
# NodeCast Local Build and Deploy Script for TrueNAS Scale
# This script builds NodeCast directly on your TrueNAS Scale system

echo "🚀 NodeCast Local Build & Deploy Script"
echo "📍 Building directly on TrueNAS Scale..."
echo ""

# Set variables
REPO_URL="https://github.com/InfamousMorningstar/NodeCast.git"
BUILD_DIR="/tmp/nodecast-build"
IMAGE_NAME="nodecast:local"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not available"
    echo "Please install Docker on your TrueNAS Scale system"
    exit 1
fi

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed or not available"
    echo "Installing git..."
    apt-get update && apt-get install -y git
fi

echo "🔄 Cleaning up previous builds..."
rm -rf $BUILD_DIR

echo "📥 Cloning NodeCast repository..."
git clone $REPO_URL $BUILD_DIR
cd $BUILD_DIR

echo "🔨 Building NodeCast Docker image..."
docker build -t $IMAGE_NAME --build-arg NODECAST_GIT_SHA=$(git rev-parse --short HEAD) .

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ NodeCast Docker image built successfully!"
    echo "🏷️  Image name: $IMAGE_NAME"
    echo ""
    echo "🔧 Next steps:"
    echo "1. Update your portainer-truenas.yml to use: $IMAGE_NAME"
    echo "2. Deploy via Portainer"
    echo "3. Access NodeCast at: http://192.168.1.113:3000"
    echo ""
    echo "📝 To use this image in Portainer:"
    echo "   Replace 'ghcr.io/infamousmorningstar/nodecast:latest' with '$IMAGE_NAME'"
else
    echo "❌ Docker build failed"
    echo "Check the build logs above for errors"
    exit 1
fi

# Cleanup
echo "🧹 Cleaning up build directory..."
rm -rf $BUILD_DIR

echo ""
echo "🎉 Local build complete! Image '$IMAGE_NAME' is ready for deployment."