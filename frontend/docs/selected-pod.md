# Selected Pod Panel Explained

This document breaks down how the **Selected Pod** experience in `frontend/src/components/PodDetails.jsx` works, what problem each UI fragment solves, and what trade-offs we considered.

## High-Level Flow

1. **Selection**: `PodList` lifts the clicked pod object into the `Dashboard` state via `setSelectedPod`.
2. **Rendering**: `PodDetails` receives that pod object (`metadata + spec`) and renders the detail panel.
3. **Live metrics**: A dedicated React Query hook polls `/api/k8s/metrics?ns=<namespace>` and extracts the matching pod entry. CPU and memory usage are normalized to millicores / MiB.
4. **History**: Each metrics refresh is pushed into in-memory `cpuHistory` / `memHistory` arrays (capped at 20 points) for sparkline-style trend bars.
5. **Actions**: Buttons at the bottom dispatch navigation to `/logs` or hit the restart endpoint (RBAC-protected) through a mutation.

If no pod is selected, the component simply displays a placeholder glass card to keep the layout stable.

## Component Breakdown

| Section | Purpose | Why we use it | Alternative(s) | If omitted |
| --- | --- | --- | --- | --- |
| Header (name + dismiss) | Identifies the active pod and gives a quick exit | Keeps context visible and prevents accidental edits to a different workload | Could use a breadcrumb or side drawer tab | Users lose track of which pod they are inspecting; closing the card becomes impossible without a page reload |
| Metadata grid (Status, Node, IP, Namespace) | Surface scheduling/placement info from the Pod spec/status | Operators can confirm the pod’s current node/IP without switching to kubectl | A table or accordion could show more detail, but would cost vertical space | Troubleshooting requires jumping back to the terminal; selection feels “empty” |
| Uptime chip | Displays derived runtime (`startTime`) | Helps validate recent restarts or churn | Could be shown as part of status text or in the metrics section | Harder to correlate pod stability with alerts |
| Metric Gauges (CPU & Memory) | Visualize instantaneous usage, limits, and history | Combines percent-of-limit progress, exact readings, and spark bars in one glance | Classic line charts (previous version), gauges without limits, or raw numbers | Without clear limits, operators misjudge headroom; without history, micro-spikes go unnoticed |
| Containers list | Show each container’s image and readiness flag | Makes multi-container pods inspectable without diving into YAML | Could rely on a collapsible table or omit image names entirely | Debugging sidecars or stuck containers requires manual CLI checks |
| Logs button | Deep-links to `/logs?ns=X&pod=Y` | One-click navigation to live log streaming simplifies troubleshooting | Could embed logs inline (but that would block UI) | Users must manually filter logs page, adding friction |
| Delete Pod button (admin only) | Calls `DELETE /k8s/pods/:pod` to terminate the workload | Gives SREs an explicit "remove" control when a pod is wedged and should not restart | Force everything through kubectl/CLI | Operators would have to leave the dashboard for destructive actions, slowing incident response |
| Restart Pod button (admin only) | Triggers `/k8s/pods/:pod/restart` | Handy for on-call engineers to recycle a bad pod safely | Expose full `kubectl delete pod` in UI or rely on CLI only | Without it, quick mitigation needs cluster-shell access; exposing broader controls increases blast radius |

### CPU Usage tile

- **Reading (e.g., 1.00 m)**: The dashboard normalizes CPU metrics into **millicores**. `1.00 m` equals one-thousandth of a core (0.001 vCPU). Kubernetes exposes CPU usage at this granularity so you can reason about very small workloads without rounding errors.
- **Limit string (e.g., “1m of 200m limit”)**: We aggregate the pod’s `resources.limits.cpu` (or fall back to `requests`) and compare live usage against that budget. In this case the pod is using 1 m out of the allowed 200 m (0.2 cores), so the radial gauge shows ~1%.
- **What happens if the limit is exceeded?** CPU is a compressible resource. The kubelet throttles the container by reducing its CPU shares; the process runs slower but usually stays alive. You’ll notice latency spikes rather than crashes.
- **Alternatives**: Showing “0.001 cores” or “0.1% of node” is technically valid, but millicores match `kubectl top`, HPA settings, and Terraform manifests. If we hid the limit entirely, operators would see a number but not know whether it is safe.

### Memory Usage tile

- **Reading (e.g., 14.0 MiB)**: Memory metrics are displayed in **Mebibytes (MiB)** to stay consistent with Metrics Server, `kubectl`, and kernel counters. The UI keeps one decimal place for clarity.
- **Limit string (e.g., “14MiB of 256MiB limit”)**: Similar to CPU, we sum `resources.limits.memory` and compute utilization (14 ÷ 256 ≈ 5%).
- **What happens if the limit is exceeded?** Memory is non-compressible. If a container allocates beyond its limit, the kubelet terminates it immediately with `OOMKilled`. The pod restarts and Kubernetes records the failure event.
- **Alternatives**: We could show decimal megabytes (MB) or bytes, but MiB avoids conversion mistakes. Removing the limit readout would hide the most important context—how close you are to an OOM event.

## Why This Composition?

- **Landscape layout**: CPU and Memory now sit side-by-side, which mirrors how engineers mentally compare resource pressure. Stacking them vertically forced extra scrolling and hid one metric on laptop screens.
- **Gauge + sparkline hybrid**: Gauges make percentage-of-limit obvious, while the spark bars keep recent spikes visible without harming performance (simple `<span>` heights). Using only line charts made limits less intuitive; using only numbers gave no sense of trends.
- **Derived metadata**: Uptime and readiness are calculated client-side so we do not round-trip to new APIs. They also degrade gracefully—if `startTime` is missing we show `--`.

## What If We Changed or Removed Pieces?

- **No metrics history**: We would still have the current reading, but false positives (brief spikes) could no longer be spotted. Consider a textual “last updated” stamp if history ever gets removed.
- **No namespace pill**: Operators comparing pods across namespaces would be forced to remember the dropdown state; misoperations (restarting the wrong namespace) become more likely.
- **No RBAC gate on Restart/Delete**: Scaling or deleting pods would become available to every authenticated user, which is often unacceptable in production. Keeping the buttons hidden for viewers avoids accidental disruptions.
- **Using tables instead of cards**: Tables work for large datasets, but the detail card is optimized for a single entity. If the panel ever needs to show dozens of attributes, consider a two-column description list.

## Customization Notes

- The visual skin (colors, border utilities) is theme-driven via CSS variables set in `src/index.css`. Any palette additions should extend those tokens instead of hard-coding values.
- Metric limits rely on `pod.containers[].resources`. If a cluster omits limits, we gracefully fall back to requests or the highest observed usage. To enforce stronger guarantees, validate limits server-side before rendering.
- History arrays are stored in component state. For long-lived sessions you may want to persist them in React Query cache or a worker to avoid resets after navigation.

With these building blocks, the Selected Pod panel provides enough operational insight to decide whether a pod is healthy, constrained, or needs intervention—all without leaving the dashboard.
