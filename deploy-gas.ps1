param (
    [string]$filePath = "Scripts\Code.gs",
    [string]$apiFilePath = "js\api.js"
)

# Configuration
$scriptId = "1TLu97O0mD8Sr8q7T0RBvt-_GchO8feMQGHunQE42NS923aQPNkH9tTNt"
$baseUrl = "https://script.google.com/macros/s"

function Deploy-GasProject {
    Write-Host "Pushing changes to Google Apps Script..."
    clasp push

    Write-Host "Creating new version..."
    $versionOutput = clasp version "Automated deployment" | Out-String
    if ($versionOutput -match "Created version (\d+)") {
        $version = $matches[1]
        Write-Host "Created version $version"
    } else {
        Write-Error "Failed to create version."
        exit 1
    }

    Write-Host "Deploying new version as web app..."
    $deployOutput = clasp deploy -V $version | Out-String
    if ($deployOutput -match "https://script\.google\.com/macros/s/[\w-]+/exec") {
        $newUrl = $matches[0]
        Write-Host "New deployment URL: $newUrl"
        return $newUrl
    } else {
        Write-Host "Falling back to deployments list..."
        $deploymentsOutput = clasp deployments | Out-String
        if ($deploymentsOutput -match "https://script\.google\.com/macros/s/[\w-]+/exec") {
            $newUrl = $matches[0]
            Write-Host "Extracted URL from deployments: $newUrl"
            return $newUrl
        } else {
            Write-Error "Failed to extract deployment URL from deployments."
            exit 1
        }
    }
}

function Update-ApiFile {
    param (
        [string]$file,
        [string]$newUrl
    )
    $content = Get-Content -Path $file -Raw
    $oldUrlPattern = 'const proxyUrl = "https://script\.google\.com/macros/s/[\w-]+/exec"'
    $newUrlLine = "const proxyUrl = `"$newUrl`""
    if ($content -match $oldUrlPattern) {
        $updatedContent = $content -replace $oldUrlPattern, $newUrlLine
        Set-Content -Path $file -Value $updatedContent -Encoding UTF8
        Write-Host "Updated $file with new URL: $newUrl"
    } else {
        Write-Error "Could not find proxyUrl in $file."
        exit 1
    }
}

$newUrl = Deploy-GasProject
Update-ApiFile -file $apiFilePath -newUrl $newUrl