# Scripts

## smoke-test.ps1

A smoke test / E2E check you can run any time (after a deploy, after making
changes, or just to sanity-check the live site) covering:

- **Security** - auth enforcement on every sensitive route, forged session
  rejection, HTTPS, noindex, auth endpoint behavior
- **Features** - API validation, error handling, malformed input, basic
  resilience under rapid requests
- **UX/UI** - page load, response time, asset availability, expected HTML
  structure

### How to run it

On Windows, open PowerShell and run:

```powershell
cd path\to\our-sanctuary\scripts
.\smoke-test.ps1
```

If you get a "running scripts is disabled" error, you may need to allow
local scripts to run (once, per machine):

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

To test a different URL (e.g. before a custom domain is set up, or to test
locally):

```powershell
.\smoke-test.ps1 -BaseUrl "https://our-sanctuary-service-xxxxx.run.app"
```

For full detail on every check (not just failures):

```powershell
.\smoke-test.ps1 -VerboseOutput
```

### What it does NOT do

This script does not log in with a real Google account (it has no
credentials to do so safely), so it can't exercise the full authenticated
save/read flow end-to-end. Most checks verify that protected routes
correctly *reject* unauthenticated access - which still catches a wide
class of real regressions (an accidentally-unprotected route, a crash on
bad input, a broken page load) without needing real credentials sitting in
a script on your machine.

### Updating this script

Whenever a new API route is added, add it to the relevant list in the
script (`$protectedRoutes` for the security section is the most important
one to keep current - a route missing from that list just means it won't
be checked, not that it's actually insecure, but keeping the list current
maximizes how much this script actually catches).
