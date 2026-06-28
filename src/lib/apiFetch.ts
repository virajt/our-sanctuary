/**
 * Thin wrapper around fetch() for all /api calls.
 *
 * - Always sends the session cookie (credentials: "include"), so this keeps
 *   working correctly even if the app is ever served from a different
 *   subdomain/proxy setup in Cloud Run.
 * - Centralizes 401 handling: if the session has expired or been revoked
 *   (e.g. you removed someone from ALLOWED_EMAILS), every call site gets
 *   that behavior for free instead of needing to check it everywhere.
 * - Centralizes failure visibility: any other non-2xx response broadcasts
 *   a global event carrying the server's error message, so a failed save
 *   surfaces to the person instead of silently doing nothing - this was a
 *   real, confirmed bug (a gift purchase failing validation showed no
 *   error at all, just nothing happening when you clicked submit).
 */
function isEditRoute(url: string, method: string): boolean {
  if (method === "GET") return false;
  const skipList = ["/gifts/generate", "/kitchen/generate", "/gallery/prompt", "/api/auth/", "/api/database"];
  if (skipList.some(skip => url.includes(skip))) return false;
  return true;
}

async function promptForNotificationTarget(): Promise<"Both" | "Self" | "Cancel"> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.backgroundColor = "rgba(0,0,0,0.7)";
    overlay.style.backdropFilter = "blur(8px)";
    overlay.style.zIndex = "99999";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.opacity = "0";
    overlay.style.transition = "opacity 0.2s ease";

    const modal = document.createElement("div");
    modal.style.backgroundColor = "#111";
    modal.style.border = "1px solid #33001b";
    modal.style.borderRadius = "20px";
    modal.style.padding = "30px";
    modal.style.maxWidth = "400px";
    modal.style.width = "90%";
    modal.style.textAlign = "center";
    modal.style.boxShadow = "0 10px 40px rgba(0,0,0,0.5)";
    modal.style.transform = "scale(0.95)";
    modal.style.transition = "transform 0.2s ease";
    
    modal.innerHTML = `
      <h3 style="color: #ffdde6; font-family: serif; font-weight: 300; font-size: 22px; margin-top: 0;">Audit Log Settings</h3>
      <p style="color: #a1a1aa; font-family: sans-serif; font-size: 14px; margin-bottom: 25px; line-height: 1.5;">
        You are about to modify the Sanctuary. Do you want to notify both of us, or keep this action a secret?
      </p>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button id="audit-both" style="background: rgba(255, 77, 109, 0.15); border: 1px solid rgba(255, 77, 109, 0.4); color: #ffb3c6; padding: 12px; border-radius: 12px; cursor: pointer; font-family: sans-serif; transition: all 0.2s; font-size: 14px;">
          Notify Both of Us
        </button>
        <button id="audit-self" style="background: rgba(255,255,255,0.02); border: 1px solid #333; color: #a1a1aa; padding: 12px; border-radius: 12px; cursor: pointer; font-family: sans-serif; transition: all 0.2s; font-size: 14px;">
          Only Notify Me (Secret)
        </button>
        <button id="audit-cancel" style="background: transparent; border: none; color: #71717a; padding: 12px; margin-top: 5px; cursor: pointer; font-family: sans-serif; font-size: 12px;">
          Cancel Action
        </button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      modal.style.transform = "scale(1)";
    });

    const cleanup = (result: "Both" | "Self" | "Cancel") => {
      overlay.style.opacity = "0";
      modal.style.transform = "scale(0.95)";
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
        resolve(result);
      }, 200);
    };

    modal.querySelector("#audit-both")?.addEventListener("click", () => cleanup("Both"));
    modal.querySelector("#audit-self")?.addEventListener("click", () => cleanup("Self"));
    modal.querySelector("#audit-cancel")?.addEventListener("click", () => cleanup("Cancel"));
  });
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  let finalUrl = url;
  const method = (options.method || "GET").toUpperCase();

  if (isEditRoute(url, method)) {
    const target = await promptForNotificationTarget();
    if (target === "Cancel") {
      throw new Error("Action cancelled by user.");
    }
    finalUrl = url + (url.includes("?") ? "&" : "?") + "notify=" + target;
  }

  const response = await fetch(finalUrl, {
    ...options,
    credentials: "include",
  });

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent("sanctuary:unauthorized"));
  } else if (!response.ok) {
    let message = "Something went wrong saving that. Please try again.";
    try {
      const data = await response.clone().json();
      if (data?.error) message = data.error;
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent("sanctuary:apiError", { detail: { message, status: response.status, url: finalUrl } }));
  }

  return response;
}
