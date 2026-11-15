/**
 * Cle d'idempotence d'une soumission (en-tete Idempotency-Key).
 * crypto.randomUUID n'existe pas dans tous les contextes (HTTP non securise) : repli sur getRandomValues.
 */
export function newIdempotencyKey(): string
{
    const cryptoRef: Crypto | undefined = typeof crypto !== 'undefined' ? crypto : undefined;
    if (cryptoRef && typeof cryptoRef.randomUUID === 'function') return cryptoRef.randomUUID();
    const bytes = new Uint8Array(16);
    if (cryptoRef && typeof cryptoRef.getRandomValues === 'function') cryptoRef.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
