#!/bin/bash
# Sends a build-completion email via Resend.
#
# Lives as a real script file (not inline in cloudbuild.yaml) specifically
# to avoid Cloud Build's substitution scanner, which inspects every string
# in a step's `args` for variable-name-like tokens and tries to resolve
# them as ITS OWN substitutions before bash ever runs - regardless of
# $VAR vs ${VAR} syntax. A shell variable assigned and used entirely
# within a script file never goes through that scan, since Cloud Build
# only substitutes within the YAML's own string values, not the contents
# of files it runs.
#
# Expects two environment variables to be set by the caller:
#   RESEND_API_KEY - the Resend API key
#   NOTIFY_EMAIL    - one address, or several comma-separated addresses
#   COMMIT_SHA      - (optional) included in the email body

set -e

if [ -z "$RESEND_API_KEY" ]; then
  echo "RESEND_API_KEY is not set - skipping build-completion email."
  exit 0
fi
if [ -z "$NOTIFY_EMAIL" ]; then
  echo "NOTIFY_EMAIL is not set - skipping build-completion email."
  exit 0
fi

# Turn "a@x.com, b@y.com" into ["a@x.com","b@y.com"] for Resend's API.
TO_JSON=$(echo "$NOTIFY_EMAIL" \
  | tr ',' '\n' \
  | sed '/^[[:space:]]*$/d' \
  | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' \
  | sed 's/.*/"&"/' \
  | paste -sd ',' -)

curl -s -X POST 'https://api.resend.com/emails' \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H 'Content-Type: application/json' \
  -d "{\"from\":\"Our Sanctuary Build <onboarding@resend.dev>\",\"to\":[$TO_JSON],\"subject\":\"Build succeeded - our-sanctuary-service\",\"text\":\"Commit ${COMMIT_SHA:-unknown} built and deployed successfully.\"}"

echo ""
echo "Build-completion email sent to: $NOTIFY_EMAIL"
