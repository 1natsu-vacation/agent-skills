const revoked = new Set<string>();

export function revoke(token: string): void {
  revoked.add(token);
}

export function isRevoked(token: string): boolean {
  return revoked.has(token);
}
