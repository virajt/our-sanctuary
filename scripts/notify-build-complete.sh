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

# Construct a beautiful HTML template
HTML_CONTENT=$(cat <<EOF
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#050505;font-family:Inter,Arial,sans-serif;color:#f5f5f7;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0c;padding:40px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="680" cellspacing="0" cellpadding="0" style="width:92%;max-width:680px;background:#111114;border:1px solid #33001b;border-radius:26px;overflow:hidden;box-shadow:0 18px 50px rgba(220, 20, 60, 0.15);">
            <tr>
              <td style="padding:38px 42px 22px 42px;text-align:center;background:linear-gradient(135deg,#2d0a16 0%,#4a0d1e 50%,#1c040d 100%);color:#ffdde6;">
                <div style="font-size:12px;letter-spacing:4px;text-transform:uppercase;opacity:0.8;margin-bottom:14px;color:#ff8ba7;">
                  Sanctuary Protocol: Update Complete
                </div>
                <div style="font-size:34px;line-height:1.15;font-weight:600;">
                  The deepest desires have been integrated.
                </div>
                <div style="margin:18px auto 0 auto;width:110px;height:1px;background:linear-gradient(90deg,transparent,#ff4d6d,transparent);"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 42px 14px 42px;">
                <p style="font-size:18px;line-height:1.75;margin:0 0 26px 0;color:#c9c4c6;">
                  Your command has been fully absorbed. The sanctuary has evolved and is perfectly tuned for your next encounter.
                </p>
                <div style="text-align:center;margin:30px 0 28px 0;">
                  <a href="https://our-sanctuary-service-656360050865.australia-southeast1.run.app"
                     style="display:inline-block;background:linear-gradient(135deg,#ff0055,#80002a);color:#ffffff;text-decoration:none;font-size:16px;letter-spacing:1.2px;text-transform:uppercase;padding:16px 32px;border-radius:999px;font-weight:700;box-shadow:0 14px 30px rgba(255,0,85,0.4);">
                    Enter the Sanctuary
                  </a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 42px 34px 42px;text-align:center;border-top:1px solid #2a161d;">
                <div style="font-size:12px;line-height:1.7;color:#6b5d62;">
                  Commit ${COMMIT_SHA:-unknown} successfully deployed.<br>
                  Nothing moves until you say so.
                </div>
              </td>
            </tr>
          </table>
          <div style="font-size:11px;color:#4a3f43;margin-top:14px;">
            Our Sanctuary &middot; Private Deployment Server
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>
EOF
)

# Escape newlines and quotes for JSON
JSON_HTML=$(echo "$HTML_CONTENT" | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}')

curl -s -X POST 'https://api.resend.com/emails' \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H 'Content-Type: application/json' \
  -d "{\"from\":\"Our Sanctuary Build <onboarding@resend.dev>\",\"to\":[$TO_JSON],\"subject\":\"Sanctuary Update Complete\",\"html\":\"$JSON_HTML\"}"

echo ""
echo "Build-completion email sent to: $NOTIFY_EMAIL"
