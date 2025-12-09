# KubePulse Design Rationale

## Architecture Decisions

### Socket.io Namespaces
**Decision**: Use separate namespaces (`/logs` and `/chat`) for different real-time features.

**Rationale**:
- **Isolation**: Logs and chat have different data flows and lifecycle requirements
- **Scalability**: Allows independent scaling and optimization
- **Security**: Easier to apply different authentication/authorization rules
- **Performance**: Reduces unnecessary message broadcasting

### Redis Pub/Sub
**Decision**: Use Redis as the Socket.io adapter for multi-instance support.

**Rationale**:
- **Horizontal Scaling**: Enables multiple backend replicas to share WebSocket state
- **Message Broadcasting**: Redis pub/sub ensures messages reach all connected clients across instances
- **Session Persistence**: Maintains chat history and log streams across pod restarts
- **Production Ready**: Battle-tested solution for distributed WebSocket applications

### Metrics Server
**Decision**: Deploy metrics-server for pod/node resource metrics.

**Rationale**:
- **Real-time Monitoring**: Provides CPU/Memory usage data for dashboard
- **Native Integration**: Uses Kubernetes metrics API (metrics.k8s.io)
- **Lightweight**: Minimal resource overhead compared to full monitoring stacks
- **Standard**: De facto standard for basic Kubernetes metrics

### RBAC Mapping
**Decision**: Implement two-tier role system (Admin/Viewer) with JWT-based auth.

**Rationale**:
- **Simplicity**: Two roles cover most use cases without complexity
- **Security**: JWT tokens provide stateless authentication
- **Kubernetes Alignment**: Backend service account has cluster-wide read + limited write permissions
- **Flexibility**: Easy to extend with additional roles in the future

### Backend Service Account Permissions
**Decision**: Grant ClusterRole with read access to all namespaces, write access to deployments/pods.

**Rationale**:
- **Multi-namespace Support**: Dashboard can monitor entire cluster
- **Least Privilege**: Only grants necessary permissions for core features
- **Audit Trail**: Kubernetes RBAC logs all actions for security compliance
- **Safety**: Prevents accidental cluster-wide destructive operations

## Technology Choices

### Frontend Stack
- **React + Vite**: Fast development, modern tooling, excellent DX
- **Tailwind CSS**: Rapid UI development with neon theme customization
- **React Query**: Efficient data fetching with caching and background updates
- **xterm.js**: Industry-standard terminal emulator for log streaming

### Backend Stack
- **Node.js + Express**: JavaScript everywhere, large ecosystem
- **@kubernetes/client-node**: Official Kubernetes client library
- **MongoDB**: Flexible schema for users and chat messages
- **Socket.io**: Mature WebSocket library with fallback support

### Deployment Strategy
- **Kind**: Local development cluster that mirrors production
- **Ingress-nginx**: Standard ingress controller with broad support
- **Multi-stage Dockerfiles**: Optimized production images
- **Automated Script**: One-command deployment reduces setup friction

## Performance Optimizations

1. **Throttled Updates**: Frontend batches metric updates every 250ms
2. **Query Caching**: React Query caches API responses with 2s refetch interval
3. **Resource Limits**: All pods have defined requests/limits
4. **Image Optimization**: Multi-stage builds reduce image size
5. **Connection Pooling**: MongoDB and Redis use connection pools

## Security Considerations

1. **JWT Tokens**: Secure, stateless authentication
2. **Password Hashing**: bcrypt with salt for user passwords
3. **RBAC**: Kubernetes-native authorization
4. **TLS**: HTTPS via Ingress (self-signed for dev, Let's Encrypt for prod)
5. **Environment Variables**: Secrets managed via Kubernetes Secrets

## Future Enhancements

- **Prometheus + Grafana**: Long-term metrics and custom dashboards
- **Cert-manager**: Automated TLS certificate management
- **Horizontal Pod Autoscaler**: Auto-scale based on load
- **Multi-cluster Support**: Manage multiple Kubernetes clusters
- **Advanced RBAC**: Namespace-scoped roles, custom permissions
