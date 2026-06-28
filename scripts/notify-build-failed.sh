#!/bin/bash
# Sends a build-failure email via Resend.

set -e

if [ -z "$RESEND_API_KEY" ]; then
  echo "RESEND_API_KEY is not set - skipping build-failure email."
  exit 0
fi
if [ -z "$NOTIFY_EMAIL" ]; then
  echo "NOTIFY_EMAIL is not set - skipping build-failure email."
  exit 0
fi

FAILURE_REASON="${1:-Unknown Build Failure}"

TO_JSON=$(echo "$NOTIFY_EMAIL" \
  | tr ',' '\n' \
  | sed '/^[[:space:]]*$/d' \
  | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' \
  | sed 's/.*/"&"/' \
  | paste -sd ',' -)

HTML_CONTENT=$(cat <<EOF
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#050505;font-family:Inter,Arial,sans-serif;color:#f5f5f7;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0c;padding:40px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="680" cellspacing="0" cellpadding="0" style="width:92%;max-width:680px;background:#111114;border:1px solid #4a0000;border-radius:26px;overflow:hidden;box-shadow:0 18px 50px rgba(255, 0, 0, 0.15);">
            <tr>
              <td style="padding:38px 42px 22px 42px;text-align:center;background:linear-gradient(135deg,#3d0000 0%,#7a0000 50%,#2a0000 100%);color:#ffdde6;">
                <div style="font-size:12px;letter-spacing:4px;text-transform:uppercase;opacity:0.8;margin-bottom:14px;color:#ff8ba7;">
                  Sanctuary Protocol: Critical Alert
                </div>
                <div style="font-size:34px;line-height:1.15;font-weight:600;">
                  Deployment Failed
                </div>
                <div style="margin:18px auto 0 auto;width:110px;height:1px;background:linear-gradient(90deg,transparent,#ff0000,transparent);"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 42px 14px 42px;">
                <p style="font-size:18px;line-height:1.75;margin:0 0 26px 0;color:#c9c4c6;text-align:center;">
                  The latest code update was rejected by the system. The sanctuary remains on the previous stable version.
                </p>
                <div style="background:#2a0000;border:1px solid #5a0000;border-radius:12px;padding:20px;text-align:center;">
                  <strong style="color:#ff6b6b;font-size:16px;">Error Stage:</strong><br>
                  <span style="color:#ffcccc;font-family:monospace;font-size:14px;margin-top:8px;display:inline-block;">${FAILURE_REASON}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 42px 34px 42px;text-align:center;border-top:1px solid #2a161d;">
                <div style="font-size:12px;line-height:1.7;color:#6b5d62;">
                  Commit ${COMMIT_SHA:-unknown} failed.<br>
                  Please review the Google Cloud Build logs.
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

JSON_HTML=$(echo "$HTML_CONTENT" | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}')

curl -s -X POST 'https://api.resend.com/emails' \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H 'Content-Type: application/json' \
  -d "{\"from\":\"Our Sanctuary Build <onboarding@resend.dev>\",\"to\":[$TO_JSON],\"subject\":\"⚠️ Sanctuary Build Failed\",\"html\":\"$JSON_HTML\"}"

echo ""
echo "Build-failure email sent to: $NOTIFY_EMAIL"
