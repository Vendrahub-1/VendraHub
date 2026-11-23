export const ADMIN_RECOVERY_COOKIE = 'vendrahub_admin_recovery';
export const ADMIN_RECOVERY_TTL_SECONDS = 10 * 60;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function fromHex(value: string): Uint8Array | null {
  if (!/^(?:[0-9a-f]{2})+$/i.test(value)) return null;
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

async function recoveryKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function createAdminRecoveryProof(userId: string, secret: string): Promise<string> {
  if (secret.length < 32) throw new Error('ADMIN_RECOVERY_COOKIE_SECRET must contain at least 32 characters.');
  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_RECOVERY_TTL_SECONDS;
  const payload = `${expiresAt}.${userId}`;
  const signature = await crypto.subtle.sign('HMAC', await recoveryKey(secret), new TextEncoder().encode(payload));
  return `${payload}.${toHex(new Uint8Array(signature))}`;
}

export async function verifyAdminRecoveryProof(
  proof: string | undefined,
  userId: string,
  secret: string | undefined,
): Promise<boolean> {
  if (!proof || !secret || secret.length < 32) return false;
  const parts = proof.split('.');
  if (parts.length !== 3) return false;
  const [expiresAtText, proofUserId, signatureHex] = parts;
  const expiresAt = Number(expiresAtText);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now || expiresAt > now + ADMIN_RECOVERY_TTL_SECONDS + 30) return false;
  if (proofUserId !== userId) return false;
  const signature = fromHex(signatureHex);
  if (!signature) return false;
  const payload = `${expiresAtText}.${proofUserId}`;
  try {
    return await crypto.subtle.verify('HMAC', await recoveryKey(secret), signature, new TextEncoder().encode(payload));
  } catch {
    return false;
  }
}
