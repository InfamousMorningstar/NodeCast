# NodeCast TrueNAS Scale Deployment Guide

## Prerequisites

### 1. TrueNAS Scale System Requirements
- TrueNAS Scale with ZFS pool configured
- Docker/Kubernetes support enabled
- Portainer installed and accessible
- At least 4GB RAM available for containers
- SSD for SLOG and L2ARC (recommended for optimal performance)

### 2. ZFS Dataset Preparation
Create the following ZFS datasets on your TrueNAS Scale system:

```bash
# Replace 'tank' with your pool name
sudo zfs create tank/nodecast
sudo zfs create tank/nodecast/uploads
sudo zfs create tank/nodecast/temp
sudo zfs create tank/nodecast/postgresql
sudo zfs create tank/nodecast/public
sudo zfs create tank/nodecast/themes
sudo zfs create tank/nodecast/config
sudo zfs create tank/nodecast/redis

# Optional: Enable compression and deduplication
sudo zfs set compression=lz4 tank/nodecast
sudo zfs set dedup=on tank/nodecast/uploads
```

### 3. Required Directory Permissions
```bash
# Ensure proper permissions (replace tank with your pool name)
sudo chown -R 1000:1000 /mnt/tank/nodecast
sudo chmod -R 755 /mnt/tank/nodecast
```

## Deployment Steps

### Step 1: Build and Push Docker Image (First Time Only)

Since we need to build the NodeCast image, you have two options:

#### Option A: Build Locally and Push to Registry
```bash
# On your development machine
docker build -t nodecast:latest .
docker tag nodecast:latest your-registry/nodecast:latest
docker push your-registry/nodecast:latest
```

#### Option B: Use GitHub Actions (Recommended)
The repository includes GitHub Actions that will automatically build and push to GitHub Container Registry.

### Step 2: Prepare Environment File

1. Copy the `env-truenas-template.txt` to create your `.env` file
2. Update all paths to match your TrueNAS Scale configuration
3. Generate secure passwords and secrets

### Step 3: Deploy via Portainer

1. Open Portainer Web UI
2. Navigate to "Stacks"
3. Click "Add stack"
4. Name it "nodecast"
5. Paste the contents of `portainer-truenas.yml`
6. Configure environment variables in Portainer UI
7. Deploy the stack

### Step 4: First-Time Setup

1. Access NodeCast at `http://your-truenas-ip:3000`
2. Complete initial setup wizard
3. Create admin account
4. Configure ZFS integration settings

## Mount Paths You Need to Provide

Please provide the following information for your TrueNAS Scale system:

### Required Paths:
1. **Pool Name**: `tank` (replace with your actual pool name)
2. **Upload Storage**: `/mnt/[pool]/nodecast/uploads`
3. **Database Storage**: `/mnt/[pool]/nodecast/postgresql`
4. **Temp Directory**: `/mnt/[pool]/nodecast/temp`
5. **Public Assets**: `/mnt/[pool]/nodecast/public`
6. **Themes**: `/mnt/[pool]/nodecast/themes`
7. **Config**: `/mnt/[pool]/nodecast/config`

### Network Information:
1. **TrueNAS Scale IP**: Your server's IP address
2. **Domain Name**: (optional) if using custom domain

### ZFS Configuration:
1. **Dataset Path**: `[pool]/nodecast/uploads` (without /mnt prefix)
2. **SLOG Device**: Path to your SLOG device (optional)
3. **L2ARC Device**: Path to your L2ARC device (optional)

## Performance Optimization

### For Maximum Performance:
1. **SLOG (ZIL)**: Use fast NVMe SSD for write acceleration
2. **L2ARC**: Use large SSD for read caching
3. **Memory**: Allocate sufficient RAM for ZFS ARC
4. **Network**: Use 10GbE if available

### ZFS Tuning Commands:
```bash
# Optimize for file server workload
sudo zfs set recordsize=1M tank/nodecast/uploads
sudo zfs set compression=lz4 tank/nodecast
sudo zfs set atime=off tank/nodecast
sudo zfs set xattr=sa tank/nodecast/uploads  # Required for NodeCast metadata
```

## Monitoring and Maintenance

### Health Checks:
- PostgreSQL: Available on port 5432
- NodeCast Web: http://your-ip:3000/api/healthcheck
- WebSocket Sync: ws://your-ip:8081

### Logs:
```bash
# View container logs
docker logs nodecast-app
docker logs nodecast-postgres
docker logs nodecast-redis
```

### Backup Strategy:
1. **Database**: Regular PostgreSQL dumps
2. **Files**: ZFS snapshots of upload datasets
3. **Configuration**: Backup `/mnt/[pool]/nodecast/config`

## Troubleshooting

### Common Issues:
1. **Permission Denied**: Check directory ownership and permissions
2. **Database Connection**: Verify PostgreSQL container is healthy
3. **ZFS Operations**: Ensure privileged mode and /dev/zfs device mapping
4. **Performance**: Check SLOG/L2ARC configuration and ZFS ARC memory

### Support:
- Check container logs for detailed error messages
- Verify all mount paths exist and are accessible
- Ensure ZFS datasets are properly created and mounted