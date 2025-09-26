# 🔐 GitHub Secrets Setup for Docker Hub

To enable automatic Docker image building and publishing to Docker Hub, you need to add these secrets to your GitHub repository:

## 📋 Required Secrets

Go to your GitHub repository: `https://github.com/InfamousMorningstar/NodeCast/settings/secrets/actions`

Add these **Repository Secrets**:

| Secret Name | Secret Value |
|-------------|--------------|
| `DOCKER_USERNAME` | `morningstar0` |
| `DOCKER_PASSWORD` | `343bodf8` |

## 🚀 How to Add Secrets

1. **Go to your repository settings:**
   ```
   https://github.com/InfamousMorningstar/NodeCast/settings/secrets/actions
   ```

2. **Click "New repository secret"**

3. **Add each secret:**
   - Name: `DOCKER_USERNAME`
   - Value: `morningstar0`
   - Click "Add secret"
   
   - Name: `DOCKER_PASSWORD` 
   - Value: `343bodf8`
   - Click "Add secret"

## ✅ What This Enables

Once secrets are added, GitHub Actions will automatically:

- ✅ **Build Docker images** on every push to `trunk` branch
- ✅ **Push to Docker Hub** as `morningstar0/nodecast:latest`
- ✅ **Multi-architecture support** (amd64 + arm64)
- ✅ **Optimized caching** for faster builds
- ✅ **Tagged releases** with git SHA and branch info

## 🎯 Deployment Options

After secrets are set up, you can deploy using:

### **Option 1: Docker Hub Image (Recommended)**
```bash
# Use the automatically built image from Docker Hub
# Update portainer-truenas.yml to use: morningstar0/nodecast:latest
```

### **Option 2: Local Build (Backup)**
```bash
# If you still want to build locally
curl -fsSL https://raw.githubusercontent.com/InfamousMorningstar/NodeCast/trunk/build-local-truenas.sh | bash
```

## 🔄 Next Steps

1. Add the GitHub secrets (above)
2. Push changes to `trunk` branch
3. Watch GitHub Actions build and push the image
4. Deploy using `portainer-truenas.yml` with Docker Hub image

**No more 20-minute local builds - let GitHub do the work!** 🚀