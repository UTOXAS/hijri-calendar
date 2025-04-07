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
        Write-Host "Found existing web app deployment ID: $deploymentId"
        return $deploymentId
    } else {
        Write-Host "No web app deployment found. Creating a new one..."
        return $null
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
    clasp push --force

    Write-Host "Creating new version..."
    $versionOutput = clasp version "Automated deployment $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Out-String
    if ($versionOutput -match "Created version (\d+)") {
        $version = $matches[1]
        Write-Host "Created version $version"
    } else {
        Write-Error "Failed to create version."
        exit 1
    }

    $deploymentId = Get-DeploymentId
    if ($deploymentId) {
        Write-Host "Redeploying web app with version $version..."
        $redeployOutput = clasp redeploy $deploymentId $version "Updated deployment" | Out-String
        if ($redeployOutput -match "Deployed") {
            Write-Host "Successfully redeployed web app."
        } else {
            Write-Error "Failed to redeploy web app."
            exit 1
        }
    } else {
        Write-Host "Deploying as new web app with version $version..."
        $deployOutput = clasp deploy --versionNumber $version --description "Initial web app deployment" | Out-String
        if ($deployOutput -match "https://script\.google\.com/macros/s/[\w-]+/exec") {
            Write-Host "Successfully deployed new web app."
        } else {
            Write-Error "Failed to deploy new web app."
            exit 1
        }
    }

    $newUrl = Get-WebAppUrl
    return $newUrl
}

function Update-ApiFile {
    param (
        [string]$file,
        [string]$newUrl
    )
    $content = Get-Content -Path $file -Raw -Encoding UTF8
    $oldUrlPattern = 'const proxyUrl = "https://script\.google\.com/macros/s/[\w-]+/exec"'
    $newUrlLine = "const proxyUrl = `"$newUrl`""
    if ($content -match $oldUrlPattern) {
        $updatedContent = $content -replace $oldUrlPattern, $newUrlLine
        Set-Content -Path $file -Value $updatedContent -Encoding UTF8
        Write-Host "Updated $file with URL: $newUrl"
    } else {
        Write-Error "Could not find proxyUrl in $file to update."
        exit 1
    }
}

try {
    $newUrl = Deploy-GasProject
    Update-ApiFile -file $apiFilePath -newUrl $newUrl
    Write-Host "Deployment completed successfully."
} catch {
    Write-Error "Deployment failed: $_"
    exit 1
}