set -euo pipefail

# Reuse helpers from deploy.sh without auto-running its main
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}/deploy.sh"

helm_deploy() {
    log_info "Deploying KubePulse via Helm chart..."

    if ! command -v helm >/dev/null 2>&1; then
        echo -e "${RED}[ERROR] Helm is not installed. Please install Helm and retry.${NC}"
        exit 1
    fi

    # Ensure namespace exists (outside Helm, so Helm doesn't try to own it)
    kubectl create namespace kubepulse --dry-run=client -o yaml | kubectl apply -f - >/dev/null 2>&1 || true

    helm upgrade --install kubepulse "${SCRIPT_DIR}/helm/kubepulse" \
        --namespace kubepulse \
        --values "${SCRIPT_DIR}/helm/kubepulse/values.yaml"

    log_success "Helm release 'kubepulse' applied"
}

main_helm() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}  KubePulse Helm Deployment Script${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    check_prerequisites
    create_cluster
    build_images
    load_images
    install_ingress
    install_metrics_server
    helm_deploy
    wait_for_deployments
    create_admin_user
    update_hosts
    print_instructions
}

main_helm
