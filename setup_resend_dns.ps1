$Domain = "virajtrivedi.com"
Write-Host "Searching your GCP project for the DNS zone matching $Domain..."

$ZoneName = (gcloud dns managed-zones list --filter="dnsName=$Domain." --format="value(name)").Trim()

if ([string]::IsNullOrWhiteSpace($ZoneName)) {
    Write-Host "ERROR: Could not find a Cloud DNS zone for $Domain in your current GCP project."
    exit 1
}

Write-Host "Found DNS Zone: $ZoneName. Initiating record injection..."

gcloud dns record-sets transaction abort --zone=$ZoneName 2>$null
gcloud dns record-sets transaction start --zone=$ZoneName

Write-Host "Adding DKIM..."
gcloud dns record-sets transaction add '"p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCyJI3Wb2is9KDQ6FV07hsNYvYpsfig6S8j+aGDA7pAyK8WyNHryhY6zO+qecLis5sDRardDeDJzbMRUpho5H5jia9NdkF5v9dYQv6nlbBvELUT47QVPy8f4v+VcUmsbvJEglNivDXgjxMqcejBK5M/fNqsJumlIkpyoAKya0HSTwIDAQAB"' --name="resend._domainkey.$Domain." --ttl=300 --type=TXT --zone=$ZoneName

Write-Host "Adding SPF MX..."
gcloud dns record-sets transaction add "10 feedback-smtp.us-east-1.amazonses.com." --name="send.$Domain." --ttl=300 --type=MX --zone=$ZoneName

Write-Host "Adding SPF TXT..."
gcloud dns record-sets transaction add '"v=spf1 include:amazonses.com ~all"' --name="send.$Domain." --ttl=300 --type=TXT --zone=$ZoneName

Write-Host "Adding DMARC..."
gcloud dns record-sets transaction add '"v=DMARC1; p=none;"' --name="_dmarc.$Domain." --ttl=300 --type=TXT --zone=$ZoneName

Write-Host "Committing to Google Cloud DNS..."
gcloud dns record-sets transaction execute --zone=$ZoneName

Write-Host ""
Write-Host "SUCCESS! All 4 DNS records have been injected into GCP."
Write-Host "Please wait 60 seconds, then click 'Verify Records' in your Resend dashboard."
