# Test webhook endpoint accessibility
Write-Host "Testing webhook endpoint..." -ForegroundColor Yellow

$url = "https://radeo.in/api/v1/admin/shipping/webhook"
$token = "48f6cc854c7a94beb4ea1144ca8242ba7e78a0f5a07127364250cade5083f7a2"

$headers = @{
    "Content-Type" = "application/json"
    "x-api-key" = $token
}

$body = @{
    test = $true
    message = "Test webhook from PowerShell"
} | ConvertTo-Json

try {
    Write-Host "`nSending POST request to: $url" -ForegroundColor Cyan
    $response = Invoke-WebRequest -Uri $url -Method POST -Headers $headers -Body $body -UseBasicParsing
    
    Write-Host "`nSuccess!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host $response.Content
} catch {
    Write-Host "`nError!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.Value__)" -ForegroundColor Red
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}
