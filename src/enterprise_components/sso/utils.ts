export function createOAuthState() {
    const array = new Uint8Array(32);
    self.crypto.getRandomValues(array);
    const hashArray = Array.from(new Uint8Array(array));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}
