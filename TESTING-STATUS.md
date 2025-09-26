# ⚠️ NodeCast - TESTING/EXPERIMENTAL VERSION

**🔬 This is a testing version with known critical issues. DO NOT USE IN PRODUCTION.**

## 🚨 Current Status: UNSTABLE

This fork is currently undergoing major debugging and refactoring. Multiple critical issues prevent normal operation.

## 🐛 Known Critical Issues

### 1. **ZFS Route Registration Conflict** - CRITICAL 🔴
- **Issue**: Duplicate `/snapshots` route registration in FastifyJS
- **Impact**: Application crashes on startup with `FST_ERR_DUPLICATED_ROUTE`
- **Location**: `src/server/routes/api/zfs/utils/versioning.ts:270`
- **Cause**: ZFS versioning routes are registered multiple times regardless of environment variables
- **Status**: Partially fixed but needs testing
- **Workaround**: Set `ZFS_ENABLED=false` and `DISABLE_ZFS_ROUTES=true`

### 2. **File Upload Storage Path Mismatch** - CRITICAL 🔴
- **Issue**: Inconsistent storage path configuration between environment and Docker volumes
- **Impact**: File uploads fail silently or throw errors
- **Cause**: Environment variables reference `/nodecast/uploads` but containers expect `/app/uploads`
- **Configuration Conflict**:
  ```
  Environment: DATASOURCE_LOCAL_DIRECTORY=/nodecast/uploads
  Container:   Expected path /app/uploads
  Volume mount: ./uploads:/app/uploads
  ```
- **Status**: Identified, needs systematic fix

### 3. **Environment Variable Inconsistencies** - HIGH 🟡
- **Issue**: Multiple environment variables for same functionality
- **Examples**:
  ```
  CHUNKS_MAX vs CHUNKS_SIZE
  MAX_UPLOAD_SIZE vs UPLOADS_MAX_SIZE
  FILES_MAX_FILE_SIZE vs UPLOADS_MAX_SIZE
  ```
- **Impact**: Configuration confusion and potential conflicts

### 4. **Multiple Conflicting Configuration Files** - HIGH 🟡
- **Issue**: Project had multiple redundant and conflicting configuration files
- **Removed Files**:
  ```
  docker-compose.example.yml (identical to main)
  docker-compose.truenas.yml (TrueNAS-specific, causing confusion)
  Dockerfile.truenas (redundant TrueNAS variant)
  .env.production (redundant production config)
  tsconfig.build.json (redundant, tsup handles building)
  ```
- **Remaining Files**:
  ```
  docker-compose.yml (main production)
  docker-compose.dev.yml (development only)
  Dockerfile (main)
  Dockerfile.production (production build)
  tsconfig.json (single TypeScript config)
  tsup.config.ts (build configuration)
  .env.example (template)
  .env (local config, gitignored)
  ```
- **Impact**: Users were confused about which files to use for deployment

### 5. **Docker Compose Configuration Issues** - HIGH 🟡
- **Issue**: Multiple conflicting Docker compose configurations
- **Files**: `docker-compose.yml`, `docker-compose.dev.yml`, `docker-compose.example.yml`
- **Impact**: Unclear deployment path for users
- **Specific Issues**:
  - Port conflicts (3000 vs 3069)
  - Volume mount inconsistencies
  - Environment variable references that don't exist

### 5. **Docker Compose Configuration Issues** - HIGH 🟡
- **Issue**: Remaining docker-compose.yml has internal inconsistencies
- **Files**: `docker-compose.yml`, `docker-compose.dev.yml`
- **Impact**: Unclear deployment path for users
- **Specific Issues**:
  - Port conflicts (3000 vs 3069)
  - Volume mount inconsistencies
  - Environment variable references that don't exist

### 6. **TrueNAS Integration Incomplete** - HIGH 🟡
- **Issue**: ZFS-specific features cause application crashes
- **Missing Features**:
  - ZFS dataset management
  - Snapshot scheduling
  - Dataset quotas and permissions
- **Impact**: TrueNAS-specific optimizations don't work

### 6. **TrueNAS Integration Incomplete** - HIGH 🟡
- **Issue**: ZFS-specific features cause application crashes
- **Missing Features**:
  - ZFS dataset management
  - Snapshot scheduling
  - Dataset quotas and permissions
- **Impact**: TrueNAS-specific optimizations don't work

### 7. **Database Migration Issues** - MEDIUM 🟠
- **Issue**: Database schema includes ZFS-related tables that may not be properly initialized
- **Tables**: `zfs_snapshots`, `file_versions`, `snapshot_policies`, `zfs_datasets`
- **Impact**: Potential migration failures on fresh installations

### 7. **Database Migration Issues** - MEDIUM 🟠
- **Issue**: Database schema includes ZFS-related tables that may not be properly initialized
- **Tables**: `zfs_snapshots`, `file_versions`, `snapshot_policies`, `zfs_datasets`
- **Impact**: Potential migration failures on fresh installations

### 8. **GitHub Actions Build Pipeline Issues** - MEDIUM 🟠
- **Issue**: Build pipeline may not properly handle the ZFS route fixes
- **Impact**: Published Docker images may still contain bugs
- **Registry**: `ghcr.io/infamousmorningstar/nodecast:latest`

### 8. **GitHub Actions Build Pipeline Issues** - MEDIUM �
- **Issue**: Build pipeline may not properly handle the ZFS route fixes
- **Impact**: Published Docker images may still contain bugs
- **Registry**: `ghcr.io/infamousmorningstar/nodecast:latest`

## 🧹 Cleanup Actions Taken

### Removed Redundant Files:
- `docker-compose.example.yml` - Identical to main docker-compose.yml
- `docker-compose.truenas.yml` - TrueNAS-specific version causing confusion
- `Dockerfile.truenas` - Redundant TrueNAS-specific Dockerfile
- `.env.production` - Redundant production environment file
- Multiple temporary shell scripts created during debugging
- Temporary environment templates and deployment guides

### Remaining Structure:
```
docker-compose.yml          # Main production deployment
docker-compose.dev.yml      # Development only
Dockerfile                  # Main build
Dockerfile.production       # Production optimized build  
.env.example               # Environment template
.env                       # Local config (gitignored)
```

1. **ZFS Route Conditional Registration**: Modified versioning.ts to check environment variables before route registration
2. **Storage Path Standardization**: Updated environment templates to use `/app/uploads`
3. **Multiple Deployment Scripts**: Created various workaround scripts (removed in cleanup)

## 🧪 Testing Requirements

Before this can be considered stable:

1. **Unit Tests Needed**:
   - Route registration testing
   - Environment variable parsing
   - File upload flow testing
   - ZFS integration testing

2. **Integration Tests Needed**:
   - Fresh installation testing
   - Docker compose deployment testing
   - TrueNAS Scale integration testing
   - File upload/download workflows

3. **Performance Tests Needed**:
   - Large file upload testing
   - Concurrent user testing
   - Memory usage under load

## 🚫 What NOT to Use This For

- ❌ Production file sharing
- ❌ Important data storage
- ❌ Mission-critical applications
- ❌ Public-facing deployments

## ✅ What This CAN Be Used For

- ✅ Development and testing
- ✅ Bug reproduction
- ✅ Feature development
- ✅ Local experimentation

## 🤝 Contributing

If you want to help fix these issues:

1. **Critical Path**: Fix the ZFS route registration conflict
2. **High Priority**: Standardize storage path configuration
3. **Documentation**: Create proper deployment guides
4. **Testing**: Add comprehensive test coverage

## 📞 Support

**⚠️ NO SUPPORT PROVIDED for this testing version.**

For stable versions, refer to the original upstream repository.

---

**Last Updated**: September 25, 2025  
**Version**: 4.3.1-testing-unstable  
**Stability**: 🔴 CRITICAL ISSUES - DO NOT USE