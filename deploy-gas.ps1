param (
    [string]$filePath = "Scripts\Code.gs",
    [string]$apiFilePath = "js\api.js"
)

# Configuration
$scriptId = "1TLu97O0mD8Sr8q7T0RBvt-_GchO8feMQGHunQE42NS923aQPNkH9tTNt"
$baseUrl = "https://script.google.com/macros/s"

function Get-DeploymentId {
    $deploymentsOutput = clasp deployments | Out-String
    if ($deploymentsOutput -match "- ([\w-]+) @\d+ - Web app") {
        $deploymentId = $matches[1]
        Write-Host "Found web app deployment ID: $deploymentId"
        return $deploymentId
    } else {
        Write-Error "No web app deployment found. Please deploy manually first."
        exit 1
    }
}

function Get-WebAppUrl {
    $deploymentsOutput = clasp deployments | Out-String
    if ($deploymentsOutput -match "https://script\.google\.com/macros/s/[\w-]+/exec") {
        $url = $matches[0]
        Write-Host "Found web app URL: $url"
        return $url
    } else {
        Write-Error "No web app URL found in deployments."
        exit 1
    }
}

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

    $deploymentId = Get-DeploymentId
    Write-Host "Redeploying web app with version $version..."
    $redeployOutput = clasp redeploy $deploymentId $version "Updated deployment" | Out-String
    if ($redeployOutput -match "Deployed") {
        Write-Host "Successfully redeployed web app."
    } else {
        Write-Error "Failed to redeploy web app."
        exit 1
    }

    $newUrl = Get-WebAppUrl
    return $newUrl
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
        Write-Host "Updated $file with URL: $newUrl"
    } else {
        Write-Error "Could not find proxyUrl in $file."
        exit 1
    }
}

$newUrl = Deploy-GasProject
Update-ApiFile -file $apiFilePath -newUrl $newUrl