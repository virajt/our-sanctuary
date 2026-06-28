cd $PSScriptRoot
git add .
git commit -m "feat: migrate resend api key to db and implement initiation protocol endpoints"
git push

Write-Host "Success! The Sanctuary code has been pushed to GitHub." -ForegroundColor Green
Write-Host "GCP Cloud Build is now automatically deploying the new version." -ForegroundColor Cyan
Write-Host "Press any key to exit..."
$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
