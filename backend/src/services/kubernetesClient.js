const k8s = require('@kubernetes/client-node');

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
const k8sLog = new k8s.Log(kc);

// Metrics API is not fully typed in all versions, using CustomObjects or raw request if needed.
// For simple metrics, we can try to use the metrics.k8s.io API via custom objects.
const k8sCustomApi = kc.makeApiClient(k8s.CustomObjectsApi);

module.exports = {
    kc,
    k8sApi,
    k8sAppsApi,
    k8sCustomApi,
    k8sLog
};
