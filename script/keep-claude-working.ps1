# keep-claude-working.ps1 — keeps Claude Code working on TASK.md until it's done.
#  - keeps Windows awake while it runs (normal sleep returns when it stops)
#  - internet down  -> waits, continues automatically when it's back
#  - usage limit (5-hour or weekly) -> waits, restarts automatically when it resets
#
# SETUP (once per project):
#   1. Put this file in your project folder (e.g. scripts\keep-claude-working.ps1)
#   2. Create TASK.md in the project root describing what Claude should build
#   3. Run `claude` once in that folder, log in, and trust the folder
# RUN (from the project folder, in normal PowerShell — not inside VS Code):
#   powershell -ExecutionPolicy Bypass -File .\scripts\keep-claude-working.ps1
# STOP: Ctrl+C.   LOG: %USERPROFILE%\claude-runs.log

param(
    [string]$TaskFile  = "TASK.md",
    [int]$MaxRuns      = 50,     # safety cap on work runs (waiting doesn't count)
    [int]$LimitWaitMin = 30,     # minutes between checks while a usage limit is active
    [string]$Model     = "opus"  # never Fable
)

$project = (Get-Location).Path
$log     = Join-Path $env:USERPROFILE "claude-runs.log"

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    $guess = Join-Path $env:USERPROFILE ".local\bin"
    if (Test-Path (Join-Path $guess "claude.exe")) { $env:Path = "$guess;$env:Path" }
}
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    Write-Host "Claude Code not found. Install: irm https://claude.ai/install.ps1 | iex  (then open a new terminal)" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $TaskFile)) {
    Write-Host "No $TaskFile in $project. Create it first: describe what Claude should build." -ForegroundColor Red
    exit 1
}

$prompt = @"
Read $TaskFile (the job) and PROGRESS.md (what's done so far; create it if missing).
Continue the work from where PROGRESS.md says it stopped. Work in small steps:
after each finished step, run the relevant tests/lint if they exist, update
PROGRESS.md (done / next / open questions) and commit with a clear message.
Do as much as you can in this run, then stop.
If something is unclear, write the question under "Open questions" in PROGRESS.md,
skip that part and continue with the rest. Never edit or read .env files.
When everything in $TaskFile is done, reply with the single word ALL_DONE.
"@

# keep Windows awake while this runs
Add-Type -Namespace Win32 -Name Power -MemberDefinition @'
[System.Runtime.InteropServices.DllImport("kernel32.dll")]
public static extern uint SetThreadExecutionState(uint esFlags);
'@
$ES_CONTINUOUS = [uint32]2147483648
$KEEP_AWAKE    = [uint32]($ES_CONTINUOUS -bor 1)
function Stay-Awake { [Win32.Power]::SetThreadExecutionState($KEEP_AWAKE) | Out-Null }

function Test-Internet {
    try { Test-NetConnection api.anthropic.com -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue }
    catch { $false }
}

$runs = 0; $errors = 0
try {
    Stay-Awake
    Write-Host "Working on $TaskFile in $project. PC stays awake. Ctrl+C to stop. Log: $log" -ForegroundColor Cyan

    while ($runs -lt $MaxRuns) {
        Stay-Awake

        if (-not (Test-Internet)) {
            Write-Host "$(Get-Date -Format t)  No internet - waiting..." -ForegroundColor DarkYellow
            while (-not (Test-Internet)) { Stay-Awake; Start-Sleep -Seconds 60 }
            Write-Host "$(Get-Date -Format t)  Internet back - continuing." -ForegroundColor Green
        }

        Write-Host "$(Get-Date -Format t)  Run $($runs + 1)" -ForegroundColor Yellow
        $out  = claude -p $prompt --model $Model --permission-mode acceptEdits `
                  --allowedTools "Bash(npm *)" "Bash(npx *)" "Bash(node *)" "Bash(git add *)" "Bash(git commit *)" "Bash(git status)" "Bash(git diff *)" "Bash(git log *)" `
                  2>&1 | Out-String
        $code = $LASTEXITCODE
        Add-Content $log "`n===== $(Get-Date)  exit=$code =====`n$out"

        if ($out -match "hit your limit|usage limit|limit reached|rate limit|resets") {
            Write-Host "$(Get-Date -Format t)  Usage limit - checking again in $LimitWaitMin min..." -ForegroundColor Magenta
            Start-Sleep -Seconds ($LimitWaitMin * 60)
            continue
        }
        if ($out -match "ALL_DONE") {
            Write-Host "$(Get-Date -Format t)  All done. See PROGRESS.md and git log." -ForegroundColor Green
            break
        }
        if ($code -ne 0) {
            if (-not (Test-Internet)) { continue }          # dropped mid-run: wait and retry
            $errors++
            if ($errors -ge 10) { Write-Host "Stopped after 10 errors in a row. Check $log" -ForegroundColor Red; break }
            Start-Sleep -Seconds 120
            continue
        }
        $errors = 0
        $runs++
    }
}
finally {
    [Win32.Power]::SetThreadExecutionState($ES_CONTINUOUS) | Out-Null
    Write-Host "Stopped. Normal sleep restored." -ForegroundColor Cyan
}
