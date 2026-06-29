export function map_auth_network_error(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes('fetch failed') || msg.includes('network') || msg.includes('enotfound')) {
    return 'Could not reach the authentication service. Check your internet connection and try again.';
  }
  return message;
}
