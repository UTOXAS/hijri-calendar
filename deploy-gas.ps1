param (
    [string]$filePath = "Scripts\Code.gs",
    [string]$apiFilePath = "js\api.js"
)

# Configuration
$scriptId = "1TLu97O0mD8Sr8q7T0RBvt-_GchO8feMQGHunQE42NS923aQPNkH9tTNt"
$baseUrl = "https://script.google.com/macros/s"

function Get-DeploymentId {
    $deploymentsOutput = clasp deployments 2>&1 | Out-String
    if ($deploymentsOutput -match "- ([\w-]+) @\d+ - Web app") {
        $deploymentId = $matches[1]
        Write-Host "Found web app deployment ID: $deploymentId"
        return $deploymentId
    }
    Write-Host "No existing web app deployment found."
    return $null
}

function Get-WebAppUrl {
    $deploymentsOutput = clasp deployments 2>&1 | Out-String
    if ($deploymentsOutput -match "https://script\.google\.com/macros/s/[\w-]+/exec") {
        $url = $matches[0]
        Write-Host "Found web app URL: $url"
        return $url
    } elseif ($deploymentsOutput -match "- ([\w-]+) @\d+ - Web app") {
        $deploymentId = $matches[1]
        $url = "$baseUrl/$deploymentId/exec"
        Write-Host "Constructed web app URL: $url"
        return $url
    }
    Write-Host "No web app URL or deployment ID found."
    return $null
}

function Deploy-GasProject {
    Write-Host "Pushing changes to Google Apps Script..."
    $pushOutput = clasp push 2>&1 | Out-String
    if ($pushOutput -match "Pushed \d+ files") {
        Write-Host $pushOutput
    } else {
        Write-Error "Failed to push files: $pushOutput"
        exit 1
    }

    Write-Host "Creating new version..."
    $versionOutput = clasp version "Automated deployment" 2>&1 | Out-String
    if ($versionOutput -match "Created version (\d+)") {
        $version = $matches[1]
        Write-Host "Created version $version"
    } else {
        Write-Error "Failed to create version: $versionOutput"
        exit 1
    }

    $deploymentId = Get-DeploymentId
    if ($deploymentId) {
        Write-Host "Redeploying web app with version $version and deployment ID $deploymentId..."
        $redeployOutput = clasp redeploy $deploymentId $version "Updated deployment" 2>&1 | Out-String
        if ($redeployOutput -match "Deployed") {
            Write-Host "Successfully redeployed web app: $redeployOutput"
        } else {
            Write-Error "Failed to redeploy web app: $redeployOutput"
            exit 1
        }
    } else {
        Write-Host "No suitable deployment found. Creating a new web app deployment..."
        $deployOutput = clasp deploy -V $version -d "Initial web app deployment" 2>&1 | Out-String
        if ($deployOutput -match "Deployed") {
            Write-Host "Successfully deployed new web app: $deployOutput"
        } else {
            Write-Error "Failed to deploy new web app: $deployOutput"
            exit 1
        }
    }

    $newUrl = Get-WebAppUrl
    if (-not $newUrl) {
        Write-Error "Failed to retrieve web app URL after deployment."
        exit 1
    }
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
        Write-Error "Could not find proxyUrl pattern in $file."
        exit 1
    }
}

# Execute deployment and update API file
try {
    $newUrl = Deploy-GasProject
    Update-ApiFile -file $apiFilePath -newUrl $newUrl
    Write-Host "Deployment and update completed successfully."
} catch {
    Write-Error "Script execution failed: $_"
    exit 1
}