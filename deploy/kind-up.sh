#!/usr/bin/env bash
# Runs the whole stack (app, PostgreSQL, Keycloak, MinIO) on a local kind cluster.
# Requires: docker, kind, kubectl. Nothing is pushed to a registry or deployed remotely.
set -euo pipefail

CLUSTER=appointiko
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if ! kind get clusters | grep -qx "$CLUSTER"; then
  kind create cluster --config "$ROOT/deploy/kind-config.yaml"
fi

docker build -t appointiko:local "$ROOT"
kind load docker-image appointiko:local --name "$CLUSTER"

kubectl --context "kind-$CLUSTER" apply -k "$ROOT/deploy"
kubectl --context "kind-$CLUSTER" -n appointiko rollout restart deployment/appointiko
for d in postgres minio keycloak appointiko; do
  kubectl --context "kind-$CLUSTER" -n appointiko rollout status "deployment/$d" --timeout=300s
done

cat <<EOF

Appointiko is running on the local cluster:
  App            http://localhost:8080   (owner@appointiko.local / owner, admin@appointiko.local / admin)
  Keycloak admin http://localhost:8180   (admin / admin)
  MinIO console  http://localhost:9001   (appointiko / appointiko-dev-secret)

Tear down with: kind delete cluster --name $CLUSTER
EOF
