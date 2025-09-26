#!/bin/bash
# NodeCast Portainer Pre-deployment Check Script
# Validates system readiness and configuration before deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "  NodeCast Portainer Pre-deployment Validation"
    echo "=================================================="
    echo -e "${NC}"
}

print_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

print_fail() {
    echo -e "${RED}✗${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Validation functions
check_system_requirements() {
    print_info "Checking system requirements..."
    
    # Check if running on TrueNAS Scale
    if [ -f /etc/truenas-release ]; then
        print_pass "Running on TrueNAS Scale"
        VERSION=$(cat /etc/truenas-release)
        print_info "TrueNAS Version: $VERSION"
    else
        print_fail "Not running on TrueNAS Scale - this may still work but is untested"
    fi
    
    # Check Docker availability
    if command -v docker &> /dev/null; then
        print_pass "Docker is installed"
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        print_info "Docker version: $DOCKER_VERSION"
        
        if docker info &> /dev/null; then
            print_pass "Docker daemon is running"
        else
            print_fail "Docker daemon is not running or not accessible"
            return 1
        fi
    else
        print_fail "Docker is not installed"
        return 1
    fi
    
    # Check memory
    TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
    if [ "$TOTAL_MEM" -gt 4096 ]; then
        print_pass "Sufficient memory available (${TOTAL_MEM}MB)"
    else
        print_warn "Low memory (${TOTAL_MEM}MB) - minimum 4GB recommended"
    fi
    
    # Check disk space
    DISK_SPACE=$(df -BG / | awk 'NR==2{print $4}' | sed 's/G//')
    if [ "$DISK_SPACE" -gt 50 ]; then
        print_pass "Sufficient disk space (${DISK_SPACE}GB available)"
    else
        print_fail "Insufficient disk space (${DISK_SPACE}GB) - minimum 50GB required"
    fi
}

check_zfs_configuration() {
    print_info "Checking ZFS configuration..."
    
    # Check if ZFS is available
    if command -v zfs &> /dev/null; then
        print_pass "ZFS tools are available"
    else
        print_fail "ZFS tools not found"
        return 1
    fi
    
    # Check required datasets
    REQUIRED_DATASETS=(
        "app-pool/nodecast"
        "Centauri/nodecast"
    )
    
    for dataset in "${REQUIRED_DATASETS[@]}"; do
        if zfs list "$dataset" &> /dev/null; then
            print_pass "Dataset $dataset exists"
        else
            print_fail "Dataset $dataset does not exist"
            print_info "Create with: zfs create $dataset"
        fi
    done
    
    # Check dataset permissions
    for mount_point in "/mnt/app-pool/nodecast" "/mnt/Centauri/nodecast"; do
        if [ -d "$mount_point" ]; then
            OWNER=$(stat -c '%U:%G' "$mount_point")
            if [ "$OWNER" = "568:568" ] || [ "$OWNER" = "UNKNOWN:UNKNOWN" ]; then
                print_pass "Correct ownership for $mount_point"
            else
                print_warn "Incorrect ownership for $mount_point (found: $OWNER, expected: 568:568)"
                print_info "Fix with: chown -R 568:568 $mount_point"
            fi
        else
            print_fail "Mount point $mount_point does not exist"
        fi
    done
}

check_network_ports() {
    print_info "Checking network port availability..."
    
    REQUIRED_PORTS=(3000 8081 5432 6379 9090 3001)
    
    for port in "${REQUIRED_PORTS[@]}"; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            print_warn "Port $port is already in use"
        else
            print_pass "Port $port is available"
        fi
    done
}

check_docker_secrets() {
    print_info "Checking Docker secrets..."
    
    REQUIRED_SECRETS=(
        "nodecast_core_secret"
        "nodecast_postgres_password" 
        "nodecast_database_url"
    )
    
    for secret in "${REQUIRED_SECRETS[@]}"; do
        if docker secret inspect "$secret" &> /dev/null; then
            print_pass "Secret $secret exists"
        else
            print_fail "Secret $secret does not exist"
            print_info "Run setup-portainer-secrets.sh to create secrets"
        fi
    done
}

check_configuration_files() {
    print_info "Checking configuration files..."
    
    CONFIG_DIR="/mnt/app-pool/nodecast/config"
    
    if [ -d "$CONFIG_DIR" ]; then
        print_pass "Configuration directory exists"
    else
        print_warn "Configuration directory does not exist"
        print_info "Create with: mkdir -p $CONFIG_DIR"
    fi
    
    # Check for required config files
    REQUIRED_CONFIGS=(
        "postgresql.conf"
        "redis.conf"
        "nginx/default.conf"
    )
    
    for config in "${REQUIRED_CONFIGS[@]}"; do
        if [ -f "$CONFIG_DIR/$config" ]; then
            print_pass "Configuration file $config exists"
        else
            print_warn "Configuration file $config missing (will use defaults)"
        fi
    done
}

check_container_registry_access() {
    print_info "Checking container registry access..."
    
    # Test Docker Hub access
    if docker pull hello-world:latest &> /dev/null; then
        print_pass "Docker Hub access working"
        docker rmi hello-world:latest &> /dev/null
    else
        print_warn "Docker Hub access may be limited"
    fi
    
    # Test GitHub Container Registry access
    if docker pull ghcr.io/infamousmorningstar/nodecast:latest &> /dev/null 2>&1; then
        print_pass "GitHub Container Registry access working"
    else
        print_warn "GitHub Container Registry access may be limited"
        print_info "You may need to build the image locally"
    fi
}

generate_deployment_summary() {
    print_info "Generating deployment summary..."
    
    cat > deployment-readiness-report.txt << EOF
NodeCast Deployment Readiness Report
Generated: $(date)
System: $(uname -a)

SYSTEM INFORMATION:
- OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)
- Memory: $(free -h | awk '/^Mem:/{print $2}') total
- Disk Space: $(df -h / | awk 'NR==2{print $4}') available
- Docker Version: $(docker --version 2>/dev/null || echo "Not installed")

ZFS DATASETS:
$(zfs list | grep nodecast 2>/dev/null || echo "No NodeCast datasets found")

DOCKER SECRETS:
$(docker secret ls --format "table {{.Name}}\t{{.CreatedAt}}" 2>/dev/null | grep nodecast || echo "No NodeCast secrets found")

NETWORK PORTS:
$(netstat -tuln 2>/dev/null | grep -E ':(3000|8081|5432|6379|9090|3001) ' || echo "All required ports appear available")

NEXT STEPS:
1. Address any failed checks above
2. Run setup-portainer-secrets.sh if secrets are missing
3. Create missing ZFS datasets
4. Deploy the stack in Portainer using portainer-production.yml

EOF
    
    print_pass "Deployment readiness report saved to: deployment-readiness-report.txt"
}

main() {
    print_header
    
    OVERALL_STATUS=0
    
    # Run all checks
    check_system_requirements || OVERALL_STATUS=1
    echo
    check_zfs_configuration || OVERALL_STATUS=1
    echo
    check_network_ports
    echo
    check_docker_secrets || OVERALL_STATUS=1
    echo
    check_configuration_files
    echo
    check_container_registry_access
    echo
    
    generate_deployment_summary
    echo
    
    # Final status
    if [ $OVERALL_STATUS -eq 0 ]; then
        print_pass "System is ready for NodeCast deployment!"
        echo
        print_info "Next steps:"
        echo "1. Review the generated report: deployment-readiness-report.txt"
        echo "2. Deploy the stack in Portainer using portainer-production.yml"
        echo "3. Monitor the deployment and run health checks"
    else
        print_fail "System requires attention before deployment"
        echo
        print_info "Please address the failed checks and run this script again"
    fi
    
    return $OVERALL_STATUS
}

main "$@"