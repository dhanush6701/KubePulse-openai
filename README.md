# KubePulse — Real-Time Kubernetes Management Dashboard

KubePulse is a visually polished, neon-themed real-time dashboard for Kubernetes. It provides insights into pods, deployments, events, and resource metrics, along with log streaming and integrated team chat.

## Features

- **Real-Time Dashboard**: View Pods, Deployments, and Nodes with live updates.
- **Log Streaming**: Live log streaming from pods via WebSocket.
- **Team Chat**: Integrated chat for DevOps teams.
- **RBAC**: Admin and Viewer roles.
- **Neon UI**: Modern, dark-mode aesthetic.

## Architecture

- **Backend**: Node.js, Express, Socket.io, Redis, MongoDB, @kubernetes/client-node.
- **Frontend**: React, Vite, Tailwind CSS, React Query.
- **Infrastructure**: Kubernetes (Kind), Docker, Nginx.

## Getting Started

### Prerequisites

- Docker
- Kind (Kubernetes in Docker)
- Kubectl
- Node.js 18+

### Quick Start

1.  Clone the repository.
2.  Run the deployment script:

```bash
./deploy.sh
```

This script will:
- Create a Kind cluster.
- Build Docker images.
- Deploy MongoDB, Redis, Backend, and Frontend.
- Configure Ingress and TLS.

3.  Access the dashboard at `https://kubepulse.local`.

### TLS certificate

The deployment script generates a self-signed certificate for `kubepulse.local`. The first time you visit `https://kubepulse.local` your browser will warn that the certificate is untrusted—accept the warning to proceed. For a trusted cert, replace `kubernetes/ingress.yaml` and the TLS secret creation logic with your own certificate authority.

## Development

See `backend/README.md` and `frontend/README.md` for detailed development instructions.
# KubePulse
# KubePulse2
# KubePulse-openai
