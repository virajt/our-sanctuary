#Requires -Version 5.1
<#
.SYNOPSIS
    Smoke test / E2E test suite for Our Sanctuary.

.DESCRIPTION
    Runs a battery of checks against the live deployed site covering:
      - Security (auth enforcement, session forgery, headers, HTTPS)
      - Features (every API route's validation and happy-path behavior)
      - UX/UI (page load, asset availability, response times)

    This is read-mostly: it does NOT log in as a real user (it has no real
    Google account credentials to do so), so most "feature" tests verify
    that protected routes correctly REJECT unauthenticated requests, rather
    than exercising the full authenticated flow. This still catches a wide
    class of real bugs (a route accidentally left unprotected, broken JSON,
    wrong status codes, missing validation, slow responses, dead pages)
    without needing your real Google credentials in a script on disk.

    Run this any time you want a confidence check after a deploy, or
    before/after making changes, to quickly catch regressions.

.PARAMETER BaseUrl
    The site to test. Defaults to the production URL.

.PARAMETER VerboseOutput
    Show full request/response detail for every test, not just failures.

.EXAMPLE
    .\smoke-test.ps1
    .\smoke-test.ps1 -BaseUrl "https://our-sanctuary.virajtrivedi.com" -VerboseOutput
#>

param(
    [string]$BaseUrl = "https://our-sanctuary.virajtrivedi.com",
    [switch]$VerboseOutput
)

$ErrorActionPreference = "Stop"
$script:PassCount = 0
$script:FailCount = 0
$script:WarnCount = 0
$script:Results = @()

function Write-TestHeader {
    param([string]$Title)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor DarkCyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor DarkCyan
}

function Write-TestResult {
    param(
        [string]$Name,
        [ValidateSet("Pass", "Fail", "Warn")][string]$Status,
        [string]$Detail = ""
    )
    switch ($Status) {
        "Pass" { $script:PassCount++; $color = "Green"; $icon = "[PASS]" }
        "Fail" { $script:FailCount++; $color = "Red";   $icon = "[FAIL]" }
        "Warn" { $script:WarnCount++; $color = "Yellow"; $icon = "[WARN]" }
    }
    Write-Host "  $icon $Name" -ForegroundColor $color
    if ($Detail -and ($Status -ne "Pass" -or $VerboseOutput)) {
        Write-Host "         $Detail" -ForegroundColor DarkGray
    }
    $script:Results += [PSCustomObject]@{ Name = $Name; Status = $Status; Detail = $Detail }
}

function Invoke-SiteRequest {
    param(
        [string]$Path,
        [string]$Method = "GET",
        [string]$Body = $null,
        [hashtable]$Headers = @{},
        [int]$TimeoutSec = 15
    )
    $uri = "$BaseUrl$Path"
    try {
        $params = @{
            Uri             = $uri
            Method          = $Method
            TimeoutSec      = $TimeoutSec
            Headers         = $Headers
            UseBasicParsing = $true
        }
        # SkipHttpErrorCheck only exists on PowerShell 7+ (Core). Splatting an
        # unrecognized parameter into Invoke-WebRequest throws immediately on
        # PowerShell 5.1 (Windows PowerShell, still the default on most
        # Windows machines) - so it's only added when actually supported,
        # and PS 5.1 instead relies on the catch block below to recover the
        # response from the thrown exception.
        if ($PSVersionTable.PSVersion.Major -ge 7) {
            $params["SkipHttpErrorCheck"] = $true
        }
        if ($Body) {
            $params["Body"] = $Body
            $params["ContentType"] = "application/json"
        }
        $response = Invoke-WebRequest @params
        return [PSCustomObject]@{
            StatusCode = [int]$response.StatusCode
            Headers    = $response.Headers
            Content    = $response.Content
            Success    = $true
            Error      = $null
        }
    } catch {
        # PowerShell 5.1 throws on non-2xx instead of returning the response,
        # so pull what we can out of the exception.
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            $respStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($respStream)
            $content = $reader.ReadToEnd()
            return [PSCustomObject]@{
                StatusCode = $statusCode
                Headers    = $_.Exception.Response.Headers
                Content    = $content
                Success    = $true
                Error      = $null
            }
        }
        return [PSCustomObject]@{
            StatusCode = 0
            Headers    = $null
            Content    = $null
            Success    = $false
            Error      = $_.Exception.Message
        }
    }
}

Write-Host ""
Write-Host "  OUR SANCTUARY - SMOKE TEST SUITE" -ForegroundColor Magenta
Write-Host "  Target: $BaseUrl" -ForegroundColor DarkGray
Write-Host "  Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor DarkGray

# =============================================================================
# SECTION 1: SECURITY
# =============================================================================
Write-TestHeader "SECURITY"

# 1.1 - HTTPS enforced
if ($BaseUrl -like "https://*") {
    Write-TestResult -Name "Site uses HTTPS" -Status "Pass"
} else {
    Write-TestResult -Name "Site uses HTTPS" -Status "Fail" -Detail "BaseUrl is not https:// - intimate data must never travel over plain HTTP."
}

# 1.2 - Every sensitive API route rejects unauthenticated requests
$protectedRoutes = @(
    @{ Path = "/api/database"; Method = "GET" },
    @{ Path = "/api/gifts"; Method = "POST" },
    @{ Path = "/api/real-gifts"; Method = "POST" },
    @{ Path = "/api/gallery/upload"; Method = "POST" },
    @{ Path = "/api/period/config"; Method = "POST" },
    @{ Path = "/api/period/log"; Method = "POST" },
    @{ Path = "/api/admin/settings"; Method = "POST" },
    @{ Path = "/api/dates"; Method = "POST" },
    @{ Path = "/api/gift-purchases"; Method = "POST" },
    @{ Path = "/api/kitchen/save"; Method = "POST" },
    @{ Path = "/api/wicked/generate"; Method = "POST" }
)
foreach ($route in $protectedRoutes) {
    $result = Invoke-SiteRequest -Path $route.Path -Method $route.Method -Body "{}"
    if ($result.StatusCode -eq 401) {
        Write-TestResult -Name "$($route.Method) $($route.Path) rejects unauthenticated request" -Status "Pass"
    } elseif ($result.StatusCode -eq 0) {
        Write-TestResult -Name "$($route.Method) $($route.Path) rejects unauthenticated request" -Status "Warn" -Detail "Could not reach server: $($result.Error)"
    } else {
        Write-TestResult -Name "$($route.Method) $($route.Path) rejects unauthenticated request" -Status "Fail" -Detail "Expected 401, got $($result.StatusCode) - this route may not be protected!"
    }
}

# 1.3 - Forged session cookie is rejected (garbage JWT-shaped value)
$forgedHeaders = @{ "Cookie" = "sanctuary_session=eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImZha2VAZXhhbXBsZS5jb20ifQ.fakefakefakefakefakefakefakefakefakefakefake" }
$forgedResult = Invoke-SiteRequest -Path "/api/database" -Headers $forgedHeaders
if ($forgedResult.StatusCode -eq 401) {
    Write-TestResult -Name "Forged session cookie is rejected" -Status "Pass"
} elseif ($forgedResult.StatusCode -eq 0) {
    Write-TestResult -Name "Forged session cookie is rejected" -Status "Warn" -Detail "Could not reach server: $($forgedResult.Error)"
} else {
    Write-TestResult -Name "Forged session cookie is rejected" -Status "Fail" -Detail "Expected 401, got $($forgedResult.StatusCode) - a forged cookie should NEVER be accepted!"
}

# 1.4 - Site is not indexable by search engines (robots/noindex)
$homeResult = Invoke-SiteRequest -Path "/"
if ($homeResult.Success -and $homeResult.Content -match 'noindex') {
    Write-TestResult -Name "Site has noindex meta tag (not search-engine indexable)" -Status "Pass"
} else {
    Write-TestResult -Name "Site has noindex meta tag (not search-engine indexable)" -Status "Warn" -Detail "Could not confirm noindex tag is present - a private app should not be indexable."
}

# 1.5 - robots.txt doesn't accidentally invite crawling of sensitive paths
$robotsResult = Invoke-SiteRequest -Path "/robots.txt"
if ($robotsResult.StatusCode -eq 404) {
    Write-TestResult -Name "No public robots.txt exposing site structure" -Status "Pass"
} elseif ($robotsResult.Success) {
    Write-TestResult -Name "robots.txt response" -Status "Warn" -Detail "robots.txt exists - verify it doesn't reveal anything sensitive."
}

# 1.6 - Auth endpoints exist and behave correctly
$authMeResult = Invoke-SiteRequest -Path "/api/auth/me"
if ($authMeResult.StatusCode -eq 401) {
    Write-TestResult -Name "GET /api/auth/me returns 401 when not signed in" -Status "Pass"
} else {
    Write-TestResult -Name "GET /api/auth/me returns 401 when not signed in" -Status "Fail" -Detail "Got $($authMeResult.StatusCode) instead of 401"
}

$googleAuthNoToken = Invoke-SiteRequest -Path "/api/auth/google" -Method "POST" -Body "{}"
if ($googleAuthNoToken.StatusCode -eq 400) {
    Write-TestResult -Name "POST /api/auth/google rejects missing idToken" -Status "Pass"
} else {
    Write-TestResult -Name "POST /api/auth/google rejects missing idToken" -Status "Warn" -Detail "Expected 400, got $($googleAuthNoToken.StatusCode)"
}

$googleAuthBadToken = Invoke-SiteRequest -Path "/api/auth/google" -Method "POST" -Body '{"idToken":"not-a-real-token"}'
if ($googleAuthBadToken.StatusCode -eq 401) {
    Write-TestResult -Name "POST /api/auth/google rejects an invalid idToken" -Status "Pass"
} else {
    Write-TestResult -Name "POST /api/auth/google rejects an invalid idToken" -Status "Warn" -Detail "Expected 401, got $($googleAuthBadToken.StatusCode)"
}

# =============================================================================
# SECTION 2: FEATURES (API validation & error handling)
# =============================================================================
Write-TestHeader "FEATURES - API Validation"

# These all run unauthenticated (we don't have real credentials in this
# script), so every one of these SHOULD return 401, not 400/500 - if any of
# these returns something else, the auth gate has a gap on that specific
# route, which is exactly the kind of regression this section catches.
$validationRoutes = @(
    @{ Path = "/api/gifts"; Method = "POST"; Body = '{}' ; Name = "Create gift with no body" },
    @{ Path = "/api/gifts/test-id/claim"; Method = "POST"; Body = '{}'; Name = "Claim gift with no claimedBy" },
    @{ Path = "/api/dates"; Method = "POST"; Body = '{}'; Name = "Create date with no fields" },
    @{ Path = "/api/gift-purchases"; Method = "POST"; Body = '{"title":"Test"}'; Name = "Create purchase missing category/buyer" },
    @{ Path = "/api/period/config"; Method = "POST"; Body = '{}'; Name = "Update period config with no fields" },
    @{ Path = "/api/period/log"; Method = "POST"; Body = '{}'; Name = "Add period log with no fields" },
    @{ Path = "/api/kitchen/save"; Method = "POST"; Body = '{}'; Name = "Save recipe with no fields" },
    @{ Path = "/api/gallery/upload"; Method = "POST"; Body = '{}'; Name = "Upload photo with no fields" }
)
foreach ($route in $validationRoutes) {
    $result = Invoke-SiteRequest -Path $route.Path -Method $route.Method -Body $route.Body
    # Since we're unauthenticated, the auth gate should catch this before
    # validation even runs - 401 is the CORRECT answer here.
    if ($result.StatusCode -eq 401) {
        Write-TestResult -Name "$($route.Name) -> blocked by auth gate" -Status "Pass"
    } elseif ($result.StatusCode -eq 0) {
        Write-TestResult -Name "$($route.Name) -> blocked by auth gate" -Status "Warn" -Detail "Could not reach server: $($result.Error)"
    } else {
        Write-TestResult -Name "$($route.Name) -> blocked by auth gate" -Status "Fail" -Detail "Expected 401 (auth gate), got $($result.StatusCode) - this route may not be checking auth before processing the body!"
    }
}

# 2.1 - Unknown routes return a sane 404, not a crash
$unknownResult = Invoke-SiteRequest -Path "/api/this-route-does-not-exist"
if ($unknownResult.StatusCode -in @(401, 404)) {
    Write-TestResult -Name "Unknown API route returns 401/404, not a crash" -Status "Pass"
} else {
    Write-TestResult -Name "Unknown API route returns 401/404, not a crash" -Status "Warn" -Detail "Got $($unknownResult.StatusCode)"
}

# 2.2 - Malformed JSON body doesn't crash the server
$malformedHeaders = @{ "Content-Type" = "application/json" }
$malformedResult = Invoke-SiteRequest -Path "/api/auth/google" -Method "POST" -Body "{not valid json!!!"
if ($malformedResult.StatusCode -in @(400, 401)) {
    Write-TestResult -Name "Malformed JSON body is rejected cleanly (not a 500/crash)" -Status "Pass"
} elseif ($malformedResult.StatusCode -eq 500) {
    Write-TestResult -Name "Malformed JSON body is rejected cleanly (not a 500/crash)" -Status "Fail" -Detail "Server returned 500 for malformed JSON - this should be a clean 400."
} else {
    Write-TestResult -Name "Malformed JSON body is rejected cleanly (not a 500/crash)" -Status "Warn" -Detail "Got $($malformedResult.StatusCode)"
}

# 2.3 - Server survives back-to-back rapid requests (basic resilience, not a load test)
Write-Host ""
Write-Host "  Running 10 rapid sequential requests to check server stability..." -ForegroundColor DarkGray
$rapidFailures = 0
for ($i = 0; $i -lt 10; $i++) {
    $r = Invoke-SiteRequest -Path "/api/auth/me" -TimeoutSec 10
    if (-not $r.Success -or $r.StatusCode -eq 0) { $rapidFailures++ }
}
if ($rapidFailures -eq 0) {
    Write-TestResult -Name "Server handles 10 rapid sequential requests without dropping any" -Status "Pass"
} else {
    Write-TestResult -Name "Server handles 10 rapid sequential requests without dropping any" -Status "Fail" -Detail "$rapidFailures/10 requests failed to get any response."
}

# =============================================================================
# SECTION 3: UX / UI (page load, assets, performance)
# =============================================================================
Write-TestHeader "UX / UI"

# 3.1 - Home page loads with 200
$homePageResult = Invoke-SiteRequest -Path "/"
if ($homePageResult.StatusCode -eq 200) {
    Write-TestResult -Name "Home page loads (200 OK)" -Status "Pass"
} else {
    Write-TestResult -Name "Home page loads (200 OK)" -Status "Fail" -Detail "Got $($homePageResult.StatusCode)"
}

# 3.2 - Home page response time is reasonable
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$timedResult = Invoke-SiteRequest -Path "/"
$sw.Stop()
$elapsedMs = $sw.ElapsedMilliseconds
if ($elapsedMs -lt 3000) {
    Write-TestResult -Name "Home page responds in under 3s ($elapsedMs ms)" -Status "Pass"
} elseif ($elapsedMs -lt 8000) {
    Write-TestResult -Name "Home page responds in under 3s ($elapsedMs ms)" -Status "Warn" -Detail "Slower than ideal - could be a cold start (Cloud Run scaled from 0). Try running again."
} else {
    Write-TestResult -Name "Home page responds in under 3s ($elapsedMs ms)" -Status "Fail" -Detail "Very slow response - investigate Cloud Run logs."
}

# 3.3 - Page has expected title/meta (catches a broken/blank deploy)
if ($homePageResult.Content -match '<title>([^<]*)</title>') {
    $title = $matches[1]
    if ($title -and $title -ne "") {
        Write-TestResult -Name "Page has a non-empty <title>" -Status "Pass" -Detail "Title: $title"
    } else {
        Write-TestResult -Name "Page has a non-empty <title>" -Status "Fail"
    }
} else {
    Write-TestResult -Name "Page has a non-empty <title>" -Status "Fail" -Detail "No <title> tag found at all - page may have failed to render."
}

# 3.4 - Root element for React to mount into is present
if ($homePageResult.Content -match 'id="root"') {
    Write-TestResult -Name "React root mount point (#root) is present in HTML" -Status "Pass"
} else {
    Write-TestResult -Name "React root mount point (#root) is present in HTML" -Status "Fail" -Detail "Without this, the page would be permanently blank."
}

# 3.5 - Static asset references resolve (extract first JS bundle reference and check it loads)
if ($homePageResult.Content -match 'src="(/assets/[^"]+\.js)"') {
    $jsPath = $matches[1]
    $jsResult = Invoke-SiteRequest -Path $jsPath
    if ($jsResult.StatusCode -eq 200) {
        Write-TestResult -Name "Main JS bundle ($jsPath) loads successfully" -Status "Pass"
    } else {
        Write-TestResult -Name "Main JS bundle ($jsPath) loads successfully" -Status "Fail" -Detail "Got $($jsResult.StatusCode) - the app would be broken for everyone."
    }
} else {
    Write-TestResult -Name "Main JS bundle reference found in HTML" -Status "Warn" -Detail "Could not find a /assets/*.js reference to check."
}

if ($homePageResult.Content -match 'href="(/assets/[^"]+\.css)"') {
    $cssPath = $matches[1]
    $cssResult = Invoke-SiteRequest -Path $cssPath
    if ($cssResult.StatusCode -eq 200) {
        Write-TestResult -Name "Main CSS bundle ($cssPath) loads successfully" -Status "Pass"
    } else {
        Write-TestResult -Name "Main CSS bundle ($cssPath) loads successfully" -Status "Fail" -Detail "Got $($cssResult.StatusCode) - styling would be broken for everyone."
    }
}

# 3.6 - Favicon present (small polish check, not critical)
$faviconResult = Invoke-SiteRequest -Path "/favicon.ico"
if ($faviconResult.StatusCode -eq 200) {
    Write-TestResult -Name "Favicon loads" -Status "Pass"
} else {
    Write-TestResult -Name "Favicon loads" -Status "Warn" -Detail "Got $($faviconResult.StatusCode) - cosmetic only."
}

# 3.7 - Google Identity Services script reference present (sign-in button depends on this)
if ($homePageResult.Content -match 'accounts\.google\.com/gsi/client') {
    Write-TestResult -Name "Google Identity Services script is referenced" -Status "Pass"
} else {
    Write-TestResult -Name "Google Identity Services script is referenced" -Status "Fail" -Detail "Without this, the sign-in button can never render."
}

# =============================================================================
# SUMMARY
# =============================================================================
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor DarkCyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor DarkCyan
Write-Host ""
Write-Host "  Passed:   $script:PassCount" -ForegroundColor Green
Write-Host "  Failed:   $script:FailCount" -ForegroundColor $(if ($script:FailCount -gt 0) { "Red" } else { "DarkGray" })
Write-Host "  Warnings: $script:WarnCount" -ForegroundColor $(if ($script:WarnCount -gt 0) { "Yellow" } else { "DarkGray" })
Write-Host ""

if ($script:FailCount -gt 0) {
    Write-Host "  Failed checks:" -ForegroundColor Red
    $script:Results | Where-Object { $_.Status -eq "Fail" } | ForEach-Object {
        Write-Host "    - $($_.Name)" -ForegroundColor Red
        if ($_.Detail) { Write-Host "      $($_.Detail)" -ForegroundColor DarkGray }
    }
    Write-Host ""
    Write-Host "  Result: ISSUES FOUND - see failures above." -ForegroundColor Red
    exit 1
} else {
    Write-Host "  Result: ALL CHECKS PASSED" -ForegroundColor Green
    exit 0
}
