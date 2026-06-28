$Domain = "virajtrivedi.com"
Write-Host "Searching your GCP project for the DNS zone matching $Domain..."

$ZoneName = (gcloud dns managed-zones list --filter="dnsName=$Domain." --format="value(name)").Trim()

if ([string]::IsNullOrWhiteSpace($ZoneName)) {
    Write-Host "ERROR: Could not find a Cloud DNS zone for $Domain in your current GCP project."
    exit 1
}

Write-Host "Found DNS Zone: $ZoneName. Initiating tracking record injection..."

gcloud dns record-sets transaction abort --zone=$ZoneName 2>$null
gcloud dns record-sets transaction start --zone=$ZoneName

Write-Host "Adding CNAME for Resend Tracking (track.$Domain)..."
gcloud dns record-sets transaction add "links1.resend-dns.com." --name="track.$Domain." --ttl=300 --type=CNAME --zone=$ZoneName

Write-Host "Committing to Google Cloud DNS..."
gcloud dns record-sets transaction execute --zone=$ZoneName

Write-Host ""
Write-Host "SUCCESS! Tracking DNS record has been injected into GCP."
Write-Host "Please wait 60 seconds, then click 'Verify' in your Resend dashboard."
