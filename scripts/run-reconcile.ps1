param(
    [string]$BaseUrl = 'http://localhost:3000',
    [int]$TimeoutSeconds = 120
)

$ErrorActionPreference = 'Stop'

function Invoke-JsonRequest {
    param(
        [string]$Method,
        [string]$Uri,
        [string]$Body = ''
    )

    if ([string]::IsNullOrWhiteSpace($Body)) {
        return Invoke-RestMethod -Method $Method -Uri $Uri -ContentType 'application/json'
    }

    return Invoke-RestMethod -Method $Method -Uri $Uri -ContentType 'application/json' -Body $Body
}

Write-Host "Starting reconciliation run against $BaseUrl ..."

$runResponse = Invoke-JsonRequest -Method Post -Uri "$BaseUrl/reconcile" -Body '{}'
$runId = $runResponse.runId

if ([string]::IsNullOrWhiteSpace($runId)) {
    throw 'No runId returned from /reconcile.'
}

Write-Host "Run ID: $runId"
Write-Host 'Waiting for completion...'

$deadline = (Get-Date).AddSeconds($TimeoutSeconds)

while ($true) {
    $summaryResponse = Invoke-JsonRequest -Method Get -Uri "$BaseUrl/report/$runId/summary"
    $status = $summaryResponse.status

    if ($status -eq 'completed') {
        Write-Host 'Reconciliation completed.'
        $summaryResponse | ConvertTo-Json -Depth 10
        break
    }

    if ($status -eq 'failed') {
        Write-Host 'Reconciliation failed.'
        $summaryResponse | ConvertTo-Json -Depth 10
        exit 1
    }

    if ((Get-Date) -gt $deadline) {
        throw "Timed out waiting for run $runId to finish after $TimeoutSeconds seconds."
    }

    Start-Sleep -Seconds 2
}
