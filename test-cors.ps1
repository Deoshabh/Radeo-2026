# Test CORS preflight request
Write-Host "Testing OPTIONS preflight to https://api.radeo.in/api/v1/auth/register" -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "Origin"                         = "https://radeo.in"
    "Access-Control-Request-Method"  = "POST"
    "Access-Control-Request-Headers" = "Content-Type,Authorization"
}

try {
    # Ignore SSL certificate validation for testing
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
    
    $response = Invoke-WebRequest -Uri "https://api.radeo.in/api/v1/auth/register" `
        -Method OPTIONS `
        -Headers $headers
    
    Write-Host "✅ Response Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Headers:" -ForegroundColor Yellow
    $response.Headers.GetEnumerator() | ForEach-Object {
        Write-Host "$($_.Key): $($_.Value)"
    }
}
catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $resp = $_.Exception.Response
        Write-Host "Status Code: $($resp.StatusCode)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Headers:" -ForegroundColor Yellow
        $resp.Headers.GetEnumerator() | ForEach-Object {
            Write-Host "$($_.Key): $($_.Value)"
        }
    }
}

Write-Host ""
Write-Host "Testing actual POST to https://api.radeo.in/api/v1/auth/register" -ForegroundColor Cyan
Write-Host ""

$body = @{
    email    = "test@radeo.in"
    password = "TestPassword123"
} | ConvertTo-Json

try {
    # Ignore SSL certificate validation for testing
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
    
    $response = Invoke-WebRequest -Uri "https://api.radeo.in/api/v1/auth/register" `
        -Method POST `
        -Headers @{ "Content-Type" = "application/json" } `
        -Body $body

    Write-Host "✅ Response Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json
}
catch {
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
