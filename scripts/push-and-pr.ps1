Param(
    [string]$RepoUrl = "https://github.com/hfx563/nut.git",
    [string]$BranchName = "fix/ios-alignment",
    [string]$PatchPath = "Nut/nut-ios-fix.patch",
    [string]$CommitMsg = "fix(chat): iOS/mobile alignment for chat-screen and body",
    [switch]$NoApplyPatch
)

Set-StrictMode -Version Latest

function CommandExists($cmd) {
    $proc = Get-Command $cmd -ErrorAction SilentlyContinue
    return $null -ne $proc
}

if (-not (CommandExists git)) {
    Write-Error "git is not installed or not in PATH. Install Git and retry."
    exit 2
}

$cwd = Get-Location
Write-Host "Working directory: $cwd"

if (-not $NoApplyPatch) {
    if (Test-Path $PatchPath) {
        Write-Host "Applying patch: $PatchPath"
        # check then apply
        git apply --check $PatchPath 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Patch check failed; attempting to apply anyway..."
        }
        git apply $PatchPath
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to apply patch. Resolve conflicts or apply manually."
            exit 3
        }
    }
    else {
        Write-Host "Patch not found at $PatchPath — skipping apply."
    }
}

# create or switch to branch
$branchExists = (git rev-parse --verify --quiet refs/heads/$BranchName) -ne $null
if ($branchExists) {
    Write-Host "Switching to existing branch $BranchName"
    git checkout $BranchName
} else {
    Write-Host "Creating branch $BranchName"
    git checkout -b $BranchName
}

# stage the changed file(s)
git add Nut/style.css

# check for staged changes
$staged = git diff --cached --name-only
if (-not $staged) {
    Write-Host "No changes staged to commit. Nothing to push."
    exit 0
}

git commit -m "$CommitMsg"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Commit failed."
    exit 4
}

# ensure remote
$origin = git remote get-url origin 2>$null
if (-not $origin) {
    Write-Host "Adding remote origin $RepoUrl"
    git remote add origin $RepoUrl
}

Write-Host "Pushing branch $BranchName to origin"
git push -u origin $BranchName
if ($LASTEXITCODE -ne 0) {
    Write-Error "Push failed. Check credentials and network."
    exit 5
}

if (CommandExists gh) {
    Write-Host "Creating PR using gh"
    gh pr create --title "$CommitMsg" --body "Fix mobile top-alignment and safe-area padding." --base main --head $BranchName --fill
    exit $LASTEXITCODE
}

# Fallback: print PR URL
# extract owner/repo from RepoUrl
$m = [regex]::Match($RepoUrl, '([^/]+)/([^/.]+)(?:\.git)?$')
if ($m.Success) {
    $owner = $m.Groups[1].Value
    $repo = $m.Groups[2].Value
    $prUrl = "https://github.com/$owner/$repo/compare/main...$BranchName?expand=1"
    Write-Host "PR URL: $prUrl"
    try { Start-Process $prUrl } catch { }
} else {
    Write-Host "Push complete. Create a PR at your repository on GitHub."
}

exit 0
