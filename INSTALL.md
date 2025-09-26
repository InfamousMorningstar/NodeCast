# 🚀 NodeCast - Quick Installation Guide

NodeCast is a high-performance, self-hosted file server optimized for TrueNAS Scale with ZFS support.

## 📋 Quick Start

### 1. Download Files
```bash
# Download the Docker Compose file
curl -o docker-compose.yml https://raw.githubusercontent.com/InfamousMorningstar/NodeCast/trunk/docker-compose.yml

# Download the environment template
curl -o .env.example https://raw.githubusercontent.com/InfamousMorningstar/NodeCast/trunk/.env.example
```

### 2. Configure Environment
```bash
# Copy and edit the environment file
cp .env.example .env
nano .env  # or use your preferred editor
```

**Required changes in `.env`:**
- Set `POSTGRES_PASSWORD` to a secure password
- Set `CORE_SECRET` to a random 32+ character string
- Customize `DOMAIN` to your server's IP/hostname
- Adjust storage paths if needed

### 3. Deploy
```bash
# Create directories (if using local paths)
mkdir -p uploads temp public config themes logs

# Start NodeCast
docker-compose up -d

# Check status
docker-compose ps
```

### 4. Access
- Open `http://your-server-ip:3000` in your browser
- Complete the initial setup wizard
- Create your admin account

## 🏗️ TrueNAS Scale Installation

### Prerequisites
- TrueNAS Scale 22.12+
- Docker/Kubernetes support enabled
- ZFS pools configured

### ZFS Dataset Setup
```bash
# Create datasets (replace 'tank' with your pool name)
zfs create tank/nodecast
zfs create tank/nodecast/uploads
zfs create tank/nodecast/temp
zfs create tank/nodecast/config
zfs create tank/nodecast/themes

# Set permissions
chown -R 568:568 /mnt/tank/nodecast
chmod -R 755 /mnt/tank/nodecast

# Optimize for file server
zfs set recordsize=1M tank/nodecast/uploads
zfs set compression=lz4 tank/nodecast
zfs set atime=off tank/nodecast
```

### TrueNAS Configuration
In your `.env` file, set:
```bash
# Enable ZFS features
ZFS_ENABLED=true
ZFS_DATASET_PATH=tank/nodecast/uploads
ZFS_SNAPSHOTS=true

# Use ZFS mount paths
UPLOADS_PATH=/mnt/tank/nodecast/uploads
TEMP_PATH=/mnt/tank/nodecast/temp
CONFIG_PATH=/mnt/tank/nodecast/config
THEMES_PATH=/mnt/tank/nodecast/themes
```

Also uncomment the ZFS volume mounts in `docker-compose.yml`:
```yaml
# Uncomment these lines in the nodecast service:
- /sbin/zfs:/usr/local/bin/zfs:ro
- /sbin/zpool:/usr/local/bin/zpool:ro
- /proc:/host/proc:ro
- /sys:/host/sys:ro

# And these capabilities:
cap_add:
  - SYS_ADMIN
  - DAC_OVERRIDE
devices:
  - /dev/zfs:/dev/zfs
```

## 🐋 Portainer Installation

1. **Copy files to TrueNAS:**
   ```bash
   cd /mnt/your-pool/
   mkdir nodecast && cd nodecast
   # Upload docker-compose.yml and .env files
   ```

2. **In Portainer:**
   - Go to **Stacks** → **Add stack**
   - Name: `nodecast`
   - Upload your `docker-compose.yml`
   - Add environment variables from your `.env` file
   - Deploy

## 🔧 Configuration Options

### Environment Variables
All configuration is done via environment variables in the `.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_PASSWORD` | *required* | Database password |
| `CORE_SECRET` | *required* | Application secret key |
| `DOMAIN` | `localhost:3000` | Your server domain/IP |
| `MAX_UPLOAD_SIZE` | `1GB` | Maximum file upload size |
| `USER_REGISTRATION` | `true` | Allow new user signups |
| `ZFS_ENABLED` | `false` | Enable ZFS integration |

### Storage Paths
Customize storage locations by setting these variables:
- `UPLOADS_PATH` - Main file storage
- `TEMP_PATH` - Temporary files
- `CONFIG_PATH` - Configuration files
- `THEMES_PATH` - Custom themes

## 🔍 Troubleshooting

### Check Container Status
```bash
docker-compose ps
docker-compose logs nodecast
```

### Common Issues
1. **Database connection failed**: Check `POSTGRES_PASSWORD` in `.env`
2. **Permission denied**: Ensure storage directories are writable
3. **ZFS not working**: Verify ZFS tools are available and permissions are set

### Health Check
```bash
curl http://localhost:3000/api/healthcheck
```

## 🔄 Updates

```bash
# Pull latest image
docker-compose pull

# Recreate containers with new image
docker-compose up -d
```

## 📚 Features

- ✅ **High-Performance File Server** - Optimized for large files
- ✅ **ZFS Integration** - Snapshots, compression, deduplication  
- ✅ **Real-time Sync** - WebSocket-based file synchronization
- ✅ **Image Processing** - Automatic thumbnails and compression
- ✅ **Multi-user Support** - Role-based access control
- ✅ **API & Webhooks** - Programmatic access
- ✅ **TrueNAS Scale Optimized** - Native ZFS pool integration

## 📞 Support

- **GitHub Issues**: [Report bugs and feature requests](https://github.com/InfamousMorningstar/NodeCast/issues)
- **Documentation**: See the `docs/` folder for detailed guides
- **Community**: Join our discussions for help and tips

---

**🎉 Welcome to NodeCast - Your high-performance file server is ready!**