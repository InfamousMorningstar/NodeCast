# NodeCast Portainer Deployment Guide
## Enterprise-Grade Docker Deployment with 30+ Years DevOps Best Practices

### 🎯 Overview
This guide provides a production-ready deployment of NodeCast on TrueNAS Scale using Portainer, with enterprise-grade security, monitoring, and reliability features.

## 📋 Prerequisites

### System Requirements
- **TrueNAS Scale** 22.12+ with Docker support enabled
- **Portainer** Community Edition 2.19+ installed
- **ZFS pools** configured:
  - SSD pool (`app-pool`) for performance-critical data
  - HDD pool (`Centauri`) for bulk file storage
- **Minimum Resources**:
  - 4GB RAM available for containers
  - 50GB storage for database and logs
  - Network access to Docker Hub/GitHub Container Registry

### Network Requirements
- Ports available: `3000` (NodeCast), `3001` (Grafana), `80/443` (Nginx)
- Internal network access for monitoring components
- Internet access for container image pulls

## 🚀 Quick Deployment Steps

### Step 1: Prepare TrueNAS Scale System

#### SSH into TrueNAS Scale:
```bash
ssh root@your-truenas-ip
cd /mnt/app-pool
```

#### Create ZFS datasets:
```bash
# Performance-critical data on SSD pool
zfs create app-pool/nodecast
zfs create app-pool/nodecast/postgresql
zfs create app-pool/nodecast/redis
zfs create app-pool/nodecast/config
zfs create app-pool/nodecast/themes
zfs create app-pool/nodecast/logs

# Bulk storage on HDD pool
zfs create Centauri/nodecast
zfs create Centauri/nodecast/uploads
zfs create Centauri/nodecast/temp
zfs create Centauri/nodecast/public

# Set optimal permissions
chown -R 568:568 /mnt/app-pool/nodecast /mnt/Centauri/nodecast
chmod -R 755 /mnt/app-pool/nodecast /mnt/Centauri/nodecast

# Optimize ZFS for file server workload
zfs set recordsize=1M Centauri/nodecast/uploads
zfs set compression=lz4 app-pool/nodecast Centauri/nodecast
zfs set atime=off app-pool/nodecast Centauri/nodecast
```

### Step 2: Setup Docker Secrets

#### Clone NodeCast repository:
```bash
cd /mnt/app-pool
git clone https://github.com/InfamousMorningstar/NodeCast.git nodecast
cd nodecast
```

#### Run secrets setup script:
```bash
chmod +x setup-portainer-secrets.sh
./setup-portainer-secrets.sh
```

This script will:
- Generate secure random passwords
- Create Docker secrets automatically
- Provide environment variables for Portainer

### Step 3: Deploy via Portainer

#### Access Portainer:
1. Open Portainer web interface
2. Navigate to **Stacks** → **Add stack**
3. Name the stack: `nodecast-production`

#### Upload stack configuration:
1. **Upload method**: Copy/paste the contents of `portainer-production.yml`
2. **Environment variables**: Use the generated `.env.portainer` file
3. **Advanced options**:
   - Enable **Auto-update** if desired
   - Set **Prune services** to clean up old containers

#### Deploy the stack:
1. Click **Deploy the stack**
2. Monitor deployment in **Containers** view
3. Wait for all health checks to pass (2-3 minutes)

### Step 4: Initial Configuration

#### Access NodeCast:
1. Navigate to `http://your-truenas-ip:3000`
2. Complete the initial setup wizard
3. Create admin account
4. Configure ZFS integration settings

#### Verify deployment:
```bash
# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# View logs
docker logs nodecast-app
docker logs nodecast-postgres

# Test health endpoints
curl http://localhost:3000/api/healthcheck
curl http://localhost:9090  # Prometheus (if monitoring enabled)
```

## 🔧 Configuration Files Setup

### Required Configuration Files
Place these files in `/mnt/app-pool/nodecast/config/`:

#### PostgreSQL Configuration (`postgresql.conf`):
```ini
# PostgreSQL optimized for ZFS and file server workload
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
max_connections = 100

# ZFS-specific optimizations
synchronous_commit = on
fsync = on
full_page_writes = on
wal_sync_method = fdatasync
```

#### Redis Configuration (`redis.conf`):
```ini
# Redis optimized for session management
maxmemory 200mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
tcp-backlog 511
timeout 0
tcp-keepalive 300
```

#### Nginx Configuration (`nginx/default.conf`):
```nginx
# Nginx reverse proxy for NodeCast
upstream nodecast {
    server nodecast:3000;
}

server {
    listen 80;
    server_name _;
    
    client_max_body_size 1G;
    proxy_request_buffering off;
    
    location / {
        proxy_pass http://nodecast;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /ws {
        proxy_pass http://nodecast:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    location /health {
        access_log off;
        return 200 "healthy\n";
    }
}
```

## 🔒 Security Best Practices

### Container Security
- **Non-root execution**: All containers run as non-privileged users
- **Resource limits**: CPU and memory limits prevent resource exhaustion
- **Read-only filesystems**: Where possible, containers use read-only mounts
- **Capabilities**: Minimal required capabilities only

### Network Security
- **Internal networks**: Sensitive services on internal-only networks
- **Localhost binding**: Admin interfaces bound to localhost only
- **Firewall rules**: Configure TrueNAS Scale firewall appropriately

### Secret Management
- **Docker secrets**: Sensitive data stored as Docker secrets, not environment variables
- **Encrypted storage**: Secrets encrypted at rest
- **Rotation**: Regular password rotation (quarterly recommended)

### ZFS Security
- **Dataset permissions**: Proper uid/gid mapping for container users
- **Encryption**: Consider ZFS dataset encryption for sensitive data
- **Snapshots**: Regular automated snapshots for backup/recovery

## 📊 Monitoring and Alerting

### Included Monitoring Stack
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization and dashboards
- **Loki**: Log aggregation and analysis
- **Node Exporter**: System metrics
- **Alertmanager**: Alert routing and notification

### Key Metrics to Monitor
- **Application Health**: Response time, error rates, throughput
- **System Resources**: CPU, memory, disk usage, network I/O
- **ZFS Health**: Pool status, dataset usage, I/O patterns
- **Container Health**: Container status, restart counts, resource usage

### Setting up Alerts
1. Configure Alertmanager with your notification channels
2. Set thresholds in Prometheus rules
3. Create Grafana dashboards for key metrics
4. Test alert delivery

## 🔧 Troubleshooting Guide

### Common Issues and Solutions

#### Container Won't Start
```bash
# Check logs
docker logs nodecast-app

# Check resource constraints
docker stats

# Verify permissions
ls -la /mnt/*/nodecast/
```

#### Database Connection Issues
```bash
# Check PostgreSQL health
docker exec nodecast-postgres pg_isready -U nodecast

# Test database connectivity
docker exec nodecast-app nc -z postgresql 5432

# Check database logs
docker logs nodecast-postgres
```

#### ZFS Operations Failing
```bash
# Check ZFS access from container
docker exec nodecast-app ls -la /usr/local/bin/zfs

# Verify privileged mode or capabilities
docker inspect nodecast-app | grep -i priv

# Test ZFS operations
zfs list | grep nodecast
```

#### Performance Issues
```bash
# Check resource usage
docker stats

# Monitor ZFS performance
zpool iostat -v 1

# Check network latency
ping -c 5 your-truenas-ip
```

### Log Analysis
```bash
# Application logs
docker logs -f nodecast-app

# Database logs with timestamps
docker logs -f --timestamps nodecast-postgres

# System logs
tail -f /var/log/syslog | grep -i docker

# ZFS logs
dmesg | grep -i zfs
```

### Health Check Commands
```bash
# Full system health check
curl -s http://localhost:3000/api/healthcheck | jq .

# Database health
docker exec nodecast-postgres pg_isready -U nodecast

# Redis health
docker exec nodecast-redis redis-cli ping

# Container health status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.State}}"
```

## 🔄 Maintenance Procedures

### Regular Maintenance Tasks

#### Daily
- Check container health status
- Monitor disk space usage
- Review error logs

#### Weekly
- Create ZFS snapshots
- Rotate log files
- Update container images (if auto-update disabled)

#### Monthly
- Database maintenance (VACUUM, REINDEX)
- Security updates
- Backup verification
- Performance review

### Backup Strategy
```bash
# Database backup
docker exec nodecast-postgres pg_dump -U nodecast nodecast > backup_$(date +%Y%m%d).sql

# ZFS snapshot
zfs snapshot Centauri/nodecast/uploads@backup_$(date +%Y%m%d)

# Configuration backup
tar -czf config_backup_$(date +%Y%m%d).tar.gz /mnt/app-pool/nodecast/config/
```

### Disaster Recovery
1. **Identify failure scope**: Container, service, or system-wide
2. **Restore from backups**: Database and file system recovery
3. **Redeploy stack**: Using Portainer or command line
4. **Verify functionality**: Complete system testing
5. **Document incident**: Root cause analysis and prevention

## 🔧 Performance Tuning

### ZFS Optimization
```bash
# Optimize for file server workload
zfs set recordsize=1M Centauri/nodecast/uploads
zfs set compression=lz4 Centauri/nodecast
zfs set primarycache=all Centauri/nodecast
zfs set secondarycache=all Centauri/nodecast

# If you have L2ARC cache
zpool add your-pool cache /dev/your-ssd

# If you have SLOG device
zpool add your-pool log /dev/your-nvme
```

### Application Tuning
- **Node.js heap size**: Adjust `NODE_OPTIONS=--max-old-space-size=2048`
- **Worker processes**: Tune `THUMBNAILS_MAX_WORKERS` based on CPU cores
- **Database connections**: Adjust pool size based on concurrent users
- **Redis memory**: Set `maxmemory` based on session requirements

### Network Optimization
- **Enable HTTP/2**: Configure Nginx with HTTP/2 support
- **Compression**: Enable gzip/brotli compression
- **Caching**: Set appropriate cache headers
- **Connection pooling**: Optimize database connection pools

## 📞 Support and Resources

### Getting Help
- **GitHub Issues**: Report bugs and feature requests
- **Community Forums**: TrueNAS Scale and Docker communities
- **Documentation**: Reference official Docker and ZFS documentation

### Useful Commands Reference
```bash
# Container management
docker ps -a                          # List all containers
docker logs -f <container>             # Follow logs
docker exec -it <container> /bin/sh    # Interactive shell
docker stats                          # Resource usage

# Stack management  
docker stack ls                       # List stacks
docker service ls                     # List services
docker secret ls                      # List secrets

# ZFS management
zfs list                             # List datasets
zpool status                         # Pool status
zfs get all                          # All properties
```

This deployment guide provides enterprise-grade reliability, security, and monitoring for your NodeCast installation on TrueNAS Scale using Portainer.