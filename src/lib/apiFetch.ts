/**
 * Thin wrapper around fetch() for all /api calls.
 *
 * - Always sends the session cookie (credentials: "include"), so this keeps
 *   working correctly even if the app is ever served from a different
 *   subdomain/proxy setup in Cloud Run.
 * - Centralizes 401 handling: if the session has expired or been revoked
 *   (e.g. you removed someone from ALLOWED_EMAILS), every call site gets
 *   that behavior for free instead of needing to check it everywhere.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
  });

  if (response.status === 401) {
    // Let the caller see the 401 too, but also broadcast a global event so
    // the app shell can drop back to the sign-in screen immediately.
    window.dispatchEvent(new CustomEvent("sanctuary:unauthorized"));
  }

  return response;
}
