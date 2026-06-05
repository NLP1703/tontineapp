# Déploiement complet de TontineApp sur un cluster k3d local, en une commande.
#
#   pwsh infrastructure/k8s/deploy.ps1
#
# Étapes : crée le cluster -> build les 4 images -> les importe dans le cluster
# -> applique tous les manifestes -> attend que tout soit prêt -> affiche l'URL.
#
# Prérequis : Docker Desktop démarré, k3d et kubectl dans le PATH.
$ErrorActionPreference = "Stop"
$root = Resolve-Path "$PSScriptRoot/../.."
$cluster = "tontineapp"
$images = @{
  "tontineapp/auth-service:latest"         = "services/auth-service"
  "tontineapp/tontine-service:latest"      = "services/tontine-service"
  "tontineapp/notification-service:latest" = "services/notification-service"
  "tontineapp/frontend:latest"             = "frontend"
}

Write-Host "==> 1/5 Cluster k3d" -ForegroundColor Cyan
if (-not (k3d cluster list -o json | ConvertFrom-Json | Where-Object name -eq $cluster)) {
  k3d cluster create --config "$root/infrastructure/k8s/cluster/k3d-cluster.yaml"
} else {
  Write-Host "    cluster '$cluster' déjà présent"
}

Write-Host "==> 2/5 Build des images Docker" -ForegroundColor Cyan
foreach ($img in $images.Keys) {
  $ctx = Join-Path $root $images[$img]
  Write-Host "    build $img"
  docker build -t $img $ctx
}

Write-Host "==> 3/5 Import des images dans le cluster" -ForegroundColor Cyan
k3d image import @($images.Keys) -c $cluster

Write-Host "==> 4/5 Application des manifestes" -ForegroundColor Cyan
kubectl apply -k "$root/infrastructure/k8s"

Write-Host "==> 5/5 Attente du rollout" -ForegroundColor Cyan
kubectl -n tontineapp rollout status deploy/gateway --timeout=180s

Write-Host ""
Write-Host "TontineApp est en ligne -> http://localhost:8080" -ForegroundColor Green
kubectl -n tontineapp get pods
