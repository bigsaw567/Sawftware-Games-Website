$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    Write-Host 'Enter your PostgreSQL connection string (input is hidden).'
    Write-Host 'Format: Host=localhost;Port=5432;Database=sawftware_games;Username=YOUR_LOGIN;Password=YOUR_PASSWORD'
    $secureConnection = Read-Host 'Connection string' -AsSecureString
    $connection = [System.Net.NetworkCredential]::new('', $secureConnection).Password
    if ([string]::IsNullOrWhiteSpace($connection)) { throw 'A connection string is required.' }
    # stdin keeps credentials out of command arguments, shell history, and Git.
    @{ 'ConnectionStrings:TestWebsiteDb' = $connection } |
        ConvertTo-Json -Compress | dotnet user-secrets set
    if ($LASTEXITCODE -ne 0) { throw 'Could not save user secrets.' }
    Write-Host 'Saved outside the repository. Tell Codex configuration is ready.'
}
finally {
    $connection = $null
    $secureConnection = $null
    Pop-Location
}
