cd $PSScriptRoot
git add .
git commit -m "feat: migrate resend api key to db and finalize configurations"
git push

Write-Host "Success! Code has been pushed to GitHub." -ForegroundColor Green
Write-Host "GCP Cloud Build is now automatically deploying the new version." -ForegroundColor Cyan
Write-Host "Wait about 2 minutes for the deploy to finish, then log into your Admin Panel."
Write-Host "Press any key to exit..."
$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
