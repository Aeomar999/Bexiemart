$body = Get-Content -Raw ".\register-body.json"
try {
    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -ContentType "application/json" -Body $body
    $result | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host $_.ErrorDetails.Message
}
