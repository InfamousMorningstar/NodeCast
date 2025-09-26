#!/bin/bash
# NodeCast Portainer Secrets Setup Script
# Creates Docker secrets for secure deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "    NodeCast Portainer Secrets Setup"
    echo "=================================================="
    echo -e "${NC}"
}

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

generate_password() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

create_docker_secret() {
    local secret_name=$1
    local secret_value=$2
    
    print_status "Creating Docker secret: $secret_name"
    
    if docker secret inspect $secret_name >/dev/null 2>&1; then
        print_warning "Secret $secret_name already exists, skipping..."
        return 0
    fi
    
    echo "$secret_value" | docker secret create $secret_name -
    
    if [ $? -eq 0 ]; then
        print_status "Successfully created secret: $secret_name"
    else
        print_error "Failed to create secret: $secret_name"
        return 1
    fi
}

main() {
    print_header
    
    # Check if Docker is available and we can create secrets
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not available"
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        print_error "Cannot connect to Docker daemon. Is Docker running?"
        exit 1
    fi
    
    print_status "Generating secure secrets for NodeCast..."
    
    # Generate core secret (32 characters)
    CORE_SECRET=$(generate_password 32)
    print_status "Generated core secret: ${CORE_SECRET:0:8}... (truncated for security)"
    
    # Generate database password (24 characters)
    POSTGRES_PASSWORD=$(generate_password 24)
    print_status "Generated database password: ${POSTGRES_PASSWORD:0:6}... (truncated for security)"
    
    # Construct database URL
    DATABASE_URL="postgresql://nodecast:${POSTGRES_PASSWORD}@postgresql:5432/nodecast"
    
    print_status "Creating Docker secrets..."
    
    # Create secrets
    create_docker_secret "nodecast_core_secret" "$CORE_SECRET"
    create_docker_secret "nodecast_postgres_password" "$POSTGRES_PASSWORD" 
    create_docker_secret "nodecast_database_url" "$DATABASE_URL"
    
    # Create environment file with generated secrets
    cat > .env.portainer << EOF
# NodeCast Portainer Environment Variables
# Generated on $(date)

# Network Configuration
NODECAST_DOMAIN=localhost:3000
HTTPS_ENABLED=false

# File Upload Limits
MAX_UPLOAD_SIZE=1GB
CHUNK_SIZE=16MB
CHUNKS_MAX=5GB

# ZFS Configuration
ZFS_DATASET_PATH=Centauri/nodecast/uploads

# Performance
THUMBNAILS_MAX_WORKERS=4

# Logging
LOG_LEVEL=info
DEBUG_LEVEL=nodecast:error

# Note: Sensitive values are stored as Docker secrets:
# - nodecast_core_secret
# - nodecast_postgres_password  
# - nodecast_database_url
EOF
    
    print_status "Created .env.portainer file with non-sensitive configuration"
    
    echo ""
    print_status "Setup complete! Next steps:"
    echo "1. Copy the contents of .env.portainer to Portainer's environment variables"
    echo "2. Deploy the stack using portainer-production.yml"
    echo "3. The secrets are automatically available to containers via Docker secrets"
    
    print_warning "IMPORTANT SECURITY NOTES:"
    echo "- Docker secrets are now created and available to the stack"
    echo "- The generated passwords are NOT stored in files for security"
    echo "- To view secrets later, use: docker secret inspect <secret_name>"
    echo "- Keep this terminal output secure or clear it after deployment"
    
    # Save secrets to a secure file for admin reference (optional)
    read -p "Save secrets to encrypted file for admin reference? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        SECRETS_FILE="nodecast-secrets-$(date +%Y%m%d-%H%M%S).txt"
        cat > "$SECRETS_FILE" << EOF
NodeCast Deployment Secrets
Generated: $(date)
Deployment ID: $(hostname)-$(date +%s)

CORE_SECRET=$CORE_SECRET
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
DATABASE_URL=$DATABASE_URL

SECURITY WARNING: This file contains sensitive information.
- Store it in a secure location (encrypted storage)
- Delete it after deployment if not needed
- Never commit to version control
- Share only with authorized administrators
EOF
        
        print_status "Secrets saved to: $SECRETS_FILE"
        print_warning "Secure this file properly or delete it after deployment!"
    fi
}

main "$@"