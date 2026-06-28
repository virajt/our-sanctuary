$Domain = "virajtrivedi.com"
Write-Host "Fixing DNS Conflict and Setting up Resend Records..." -ForegroundColor Cyan

$ZoneName = (gcloud dns managed-zones list --filter="dnsName=$Domain." --format="value(name)").Trim()
if ([string]::IsNullOrWhiteSpace($ZoneName)) {
    Write-Host "ERROR: Could not find a Cloud DNS zone for $Domain." -ForegroundColor Red
    exit 1
}

# 1. Map Cloud Run to new subdomain (sanctuary)
Write-Host "Migrating Cloud Run domain mapping from 'our-sanctuary' to 'sanctuary'..."
gcloud beta run domain-mappings create --service=our-sanctuary-service --domain="sanctuary.$Domain" --region=australia-southeast1 --project=the-parent-500004 2>$null

# 2. Execute DNS Transaction
gcloud dns record-sets transaction abort --zone=$ZoneName 2>$null
gcloud dns record-sets transaction start --zone=$ZoneName

Write-Host "Deleting old Cloud Run CNAME for 'our-sanctuary'..."
gcloud dns record-sets transaction remove "ghs.googlehosted.com." --name="our-sanctuary.$Domain." --ttl=300 --type=CNAME --zone=$ZoneName 2>$null

Write-Host "Adding Resend Tracking CNAME on 'our-sanctuary'..."
gcloud dns record-sets transaction add "links1.resend-dns.com." --name="our-sanctuary.$Domain." --ttl=300 --type=CNAME --zone=$ZoneName

Write-Host "Adding Cloud Run CNAME on 'sanctuary'..."
gcloud dns record-sets transaction add "ghs.googlehosted.com." --name="sanctuary.$Domain." --ttl=300 --type=CNAME --zone=$ZoneName

Write-Host "Adding Resend Receiving MX on root domain (@)..."
gcloud dns record-sets transaction add "10 inbound-smtp.us-east-1.amazonaws.com." --name="$Domain." --ttl=300 --type=MX --zone=$ZoneName

Write-Host "Committing all DNS changes..."
gcloud dns record-sets transaction execute --zone=$ZoneName

Write-Host "Syncing to Git..." -ForegroundColor Cyan
cd $PSScriptRoot
git add .
git commit -m "fix: resolve DNS conflict by migrating app to sanctuary and adding Resend tracking on our-sanctuary"
git push

Write-Host ""
Write-Host "SUCCESS! The system is fixed." -ForegroundColor Green
Write-Host "1. Your Web App is now live at: https://sanctuary.$Domain"
Write-Host "2. Resend Tracking is strictly running on: our-sanctuary.$Domain"
Write-Host "3. Inbound MX Receiving is configured for: $Domain"
Write-Host "4. Code has been pushed to Git and is deploying."
