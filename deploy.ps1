# ─── Subir cambios a GitHub ──────────────────────────────────────
Set-Location $PSScriptRoot

# Mostrar archivos modificados
$changes = git status --short
if (-not $changes) {
    Write-Host "No hay cambios pendientes." -ForegroundColor Yellow
    pause
    exit
}

Write-Host ""
Write-Host "Archivos modificados:" -ForegroundColor Cyan
Write-Host $changes
Write-Host ""

# Pedir mensaje de commit
$msg = Read-Host "Describe los cambios (Enter = fecha automatica)"
if (-not $msg.Trim()) {
    $msg = "update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

# Commit y push
git add -A
git commit -m $msg
git push origin main

Write-Host ""
Write-Host "Subido a GitHub correctamente." -ForegroundColor Green
pause
