export async function isTokenExpired() {
    const token = await getStoredToken();
    if (!token) {
        return true;
    }

    // No expiry info means the provider issued a non-expiring token
    // (e.g. GitHub's default OAuth tokens don't return expires_in)
    if (!token.expires_at) {
        return false;
    }

    const expiresAt = new Date(token.expires_at);
    const now = new Date();

    // Considering expired if less than 5 minutes remaining
    return expiresAt.getTime() - now.getTime() < 5 * 60 * 1000; // 5 minutes
}