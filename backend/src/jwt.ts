/**
 * Minimal HS256 JWT implementation using the Web Crypto API.
 * Cloudflare Workers support the Web Crypto API natively.
 */

/** JWT payload claims issued by /auth/verify. */
export interface JwtPayload {
  sub: string;       // github_id as string
  login: string;     // github_login
  device_id: string; // the device that initiated auth
  exp: number;       // unix timestamp
  iat: number;       // issued at unix timestamp
}

/** JWT_EXPIRY_DAYS controls how long issued tokens are valid. */
const JWT_EXPIRY_DAYS = 30;

/** b64url encodes a Uint8Array to base64url. */
function b64url(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/** b64urlDecode decodes a base64url string to Uint8Array. */
function b64urlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  return new Uint8Array([...bin].map((c) => c.charCodeAt(0)));
}

/** importKey imports the raw JWT_SECRET string as an HMAC-SHA256 CryptoKey. */
async function importKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

/**
 * signJWT creates a signed HS256 JWT for the given payload fields.
 *
 * @param secret   - the JWT_SECRET from Cloudflare environment
 * @param githubId - numeric GitHub user ID
 * @param login    - GitHub login (username)
 * @param deviceId - the client device UUID
 */
export async function signJWT(
  secret: string,
  githubId: number,
  login: string,
  deviceId: string,
): Promise<{ token: string; expiresAt: string }> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + JWT_EXPIRY_DAYS * 86400;

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: JwtPayload = {
    sub: String(githubId),
    login,
    device_id: deviceId,
    iat: now,
    exp,
  };

  const enc = new TextEncoder();
  const headerB64 = b64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = b64url(enc.encode(JSON.stringify(payload)));
  const signing = `${headerB64}.${payloadB64}`;

  const key = await importKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(signing));
  const token = `${signing}.${b64url(new Uint8Array(sig))}`;
  const expiresAt = new Date(exp * 1000).toISOString();

  return { token, expiresAt };
}

/**
 * verifyJWT validates the signature and expiry of a JWT.
 * Returns the payload on success, throws on failure.
 *
 * @param secret - the JWT_SECRET from Cloudflare environment
 * @param token  - the Bearer token string
 */
export async function verifyJWT(secret: string, token: string): Promise<JwtPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('invalid JWT structure');

  const [headerB64, payloadB64, sigB64] = parts;
  const signing = `${headerB64}.${payloadB64}`;

  const key = await importKey(secret);
  const enc = new TextEncoder();
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    b64urlDecode(sigB64),
    enc.encode(signing),
  );
  if (!valid) throw new Error('invalid JWT signature');

  const payload: JwtPayload = JSON.parse(
    new TextDecoder().decode(b64urlDecode(payloadB64)),
  );
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('JWT expired');
  }
  return payload;
}
