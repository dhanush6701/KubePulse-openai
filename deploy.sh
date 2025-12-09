#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing=()
    
    command -v docker >/dev/null 2>&1 || missing+=("docker")
    command -v kind >/dev/null 2>&1 || missing+=("kind")
    command -v kubectl >/dev/null 2>&1 || missing+=("kubectl")
    command -v node >/dev/null 2>&1 || missing+=("node")
    command -v npm >/dev/null 2>&1 || missing+=("npm")
    
    if [ ${#missing[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing[*]}"
        log_info "Please install missing tools and try again."
        exit 1
    fi
    
    log_success "All prerequisites found"
}

# Create Kind cluster
create_cluster() {
    log_info "Checking for existing Kind cluster..."
    
    if kind get clusters 2>/dev/null | grep -q "^kubepulse$"; then
        log_warn "Cluster 'kubepulse' already exists. Skipping creation."
        return 0
    fi
    
    log_info "Creating Kind cluster 'kubepulse'..."
    
    cat <<EOF | kind create cluster --name kubepulse --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
EOF
    
    log_success "Kind cluster created"
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."
    
    log_info "Building backend image..."
    docker build -t kubepulse-backend:local ./backend
    
    log_info "Building frontend image..."
    docker build -t kubepulse-frontend:local ./frontend
    
    log_success "Docker images built"
}

# Load images into Kind
load_images() {
    log_info "Loading images into Kind cluster..."
    
    kind load docker-image kubepulse-backend:local --name kubepulse
    kind load docker-image kubepulse-frontend:local --name kubepulse
    
    log_success "Images loaded into cluster"
}

# Install ingress-nginx
install_ingress() {
    log_info "Installing ingress-nginx..."
    
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
    
    log_info "Waiting for ingress-nginx to be ready..."
    kubectl wait --namespace ingress-nginx \
        --for=condition=ready pod \
        --selector=app.kubernetes.io/component=controller \
        --timeout=90s
    
    log_success "Ingress-nginx installed"
}

# Install metrics-server
install_metrics_server() {
    log_info "Installing metrics-server..."
    
    kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
    
    # Patch metrics-server for Kind (disable TLS verification)
    kubectl patch deployment metrics-server -n kube-system --type='json' \
        -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]' || true
    
    log_success "Metrics-server installed"
}

# Create TLS secret
create_tls_secret() {
    log_info "Creating self-signed TLS certificate..."

    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /tmp/kubepulse-tls.key \
        -out /tmp/kubepulse-tls.crt \
        -subj "/CN=kubepulse.local/O=KubePulse" \
        -addext "subjectAltName=DNS:kubepulse.local" 2>/dev/null

    kubectl create secret tls kubepulse-tls \
        --cert=/tmp/kubepulse-tls.crt \
        --key=/tmp/kubepulse-tls.key \
        -n kubepulse --dry-run=client -o yaml | kubectl apply -f -

    rm -f /tmp/kubepulse-tls.key /tmp/kubepulse-tls.crt

    log_success "TLS secret created"
}

# Deploy Kubernetes manifests
deploy_manifests() {
    log_info "Deploying Kubernetes manifests..."
    
    kubectl apply -f kubernetes/namespace.yaml
    kubectl apply -f kubernetes/mongodb-deployment.yaml
    kubectl apply -f kubernetes/redis-deployment.yaml
    kubectl apply -f kubernetes/backend-deployment.yaml
    kubectl apply -f kubernetes/frontend-deployment.yaml
    
    create_tls_secret
    
    kubectl apply -f kubernetes/ingress.yaml
    
    log_success "Manifests deployed"
}

# Wait for deployments
wait_for_deployments() {
    log_info "Waiting for deployments to be ready..."
    
    kubectl wait --for=condition=available --timeout=300s \
        deployment/mongodb -n kubepulse
    
    kubectl wait --for=condition=available --timeout=300s \
        deployment/redis -n kubepulse
    
    kubectl wait --for=condition=available --timeout=300s \
        deployment/backend -n kubepulse
    
    kubectl wait --for=condition=available --timeout=300s \
        deployment/frontend -n kubepulse
    
    log_success "All deployments ready"
}

# Create initial admin user
create_admin_user() {
    log_info "Creating initial admin user..."
    
    # Wait a bit for backend to fully initialize
    sleep 5
    
    # Get backend pod name
    BACKEND_POD=$(kubectl get pods -n kubepulse -l app=backend -o jsonpath='{.items[0].metadata.name}')
    
    # Create admin user via direct MongoDB insertion
    kubectl exec -n kubepulse "$BACKEND_POD" -- node -e "
    const mongoose = require('mongoose');
    const bcrypt = require('bcryptjs');
    
    mongoose.connect(process.env.MONGO_URI).then(async () => {
      const User = mongoose.model('User', new mongoose.Schema({
        username: String,
        email: String,
        password: String,
        role: String
      }));
      
      const exists = await User.findOne({ email: 'admin@kubepulse.local' });
      if (!exists) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Admin123!', salt);
        await User.create({
          username: 'kubepulse-admin',
          email: 'admin@kubepulse.local',
          password: hashedPassword,
          role: 'admin'
        });
        console.log('Admin user created');
      } else {
        console.log('Admin user already exists');
      }
      process.exit(0);
    });
    " 2>/dev/null || log_warn "Could not create admin user automatically"
    
    log_success "Admin user setup complete"
}

# Update /etc/hosts
update_hosts() {
    log_info "Updating /etc/hosts..."
    
    if grep -q "kubepulse.local" /etc/hosts; then
        log_warn "Entry for kubepulse.local already exists in /etc/hosts"
    else
        log_info "Adding kubepulse.local to /etc/hosts (requires sudo)..."
        echo "127.0.0.1 kubepulse.local" | sudo tee -a /etc/hosts >/dev/null
        log_success "/etc/hosts updated"
    fi
}

# Print final instructions
print_instructions() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_success "KubePulse deployment complete!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${GREEN}Access the dashboard:${NC}"
    echo -e "  ${BLUE}https://kubepulse.local${NC}"
    echo ""
    echo -e "${GREEN}Default credentials:${NC}"
    echo -e "  Email:    ${YELLOW}admin@kubepulse.local${NC}"
    echo -e "  Password: ${YELLOW}Admin123!${NC}"
    echo ""
    echo -e "${GREEN}Useful commands:${NC}"
    echo -e "  View pods:        ${BLUE}kubectl get pods -n kubepulse${NC}"
    echo -e "  View logs:        ${BLUE}kubectl logs -n kubepulse deployment/backend -f${NC}"
    echo -e "  Check ingress:    ${BLUE}kubectl get ingress -n kubepulse${NC}"
    echo -e "  Port forward:     ${BLUE}kubectl port-forward -n kubepulse svc/backend 5000:5000${NC}"
    echo ""
    echo -e "${YELLOW}Note:${NC} You may need to accept the self-signed certificate in your browser."
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Main execution
main() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}        KubePulse Deployment Script${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    check_prerequisites
    create_cluster
    build_images
    load_images
    install_ingress
    install_metrics_server
    deploy_manifests
    wait_for_deployments
    create_admin_user
    update_hosts
    print_instructions
}

# Run main when executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main
fi
