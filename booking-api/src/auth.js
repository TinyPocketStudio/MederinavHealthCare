// Who is calling the staff API?
//
// The staff page is protected by Cloudflare Access: staff log in with a one-time code sent
// to their own email address, and Cloudflare adds a signed token (a JWT) to every request.
// We check that token's signature, audience, issuer and expiry here as well, so the API stays
// closed even if the Access settings were ever changed by mistake.
//
// Settings (Cloudflare → Worker → Settings → Variables and secrets):
//   ACCESS_TEAM_DOMAIN  "<team name>.cloudflareaccess.com"
//   ACCESS_AUD          the Access application's "Application Audience (AUD) Tag"
// Until both are set, nobody is let in.

const CERTS_TTL_MS = 60 * 60 * 1000;
let certCache = { domain: "", keys: [], at: 0 };

const b64urlToBytes = (s) => {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
};
const decodeJson = (s) => JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));

async function signingKey(teamDomain, kid) {
  for (const refresh of [false, true]) {
    const stale = Date.now() - certCache.at > CERTS_TTL_MS || certCache.domain !== teamDomain;
    if (refresh || stale) {
      const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
      if (!res.ok) throw new Error(`Access certs ${res.status}`);
      certCache = { domain: teamDomain, keys: (await res.json()).keys || [], at: Date.now() };
    }
    const jwk = certCache.keys.find((k) => k.kid === kid);
    if (jwk) return crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    if (refresh) return null; // Cloudflare rotates keys; one refresh, then give up.
  }
  return null;
}

/** Returns { email } of the logged-in staff member, or null. */
export async function staffUser(request, env) {
  // Local testing only (`npm run dev`): ADMIN_DEV_EMAIL from .dev.vars, and only on localhost.
  const host = new URL(request.url).hostname;
  if (env.ADMIN_DEV_EMAIL && (host === "localhost" || host === "127.0.0.1")) return { email: env.ADMIN_DEV_EMAIL };

  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return null;
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  const parts = token ? token.split(".") : [];
  if (parts.length !== 3) return null;

  try {
    const header = decodeJson(parts[0]);
    const payload = decodeJson(parts[1]);
    if (header.alg !== "RS256") return null;
    const key = await signingKey(env.ACCESS_TEAM_DOMAIN, header.kid);
    if (!key) return null;
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5", key, b64urlToBytes(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    );
    if (!valid) return null;

    const now = Math.floor(Date.now() / 1000);
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!audiences.includes(env.ACCESS_AUD)) return null;
    if (payload.iss !== `https://${env.ACCESS_TEAM_DOMAIN}`) return null;
    if (typeof payload.exp !== "number" || payload.exp < now) return null;
    if (typeof payload.email !== "string" || !payload.email) return null;
    return { email: payload.email.toLowerCase() };
  } catch (err) {
    console.error("Access token check failed:", err);
    return null;
  }
}
