// Simple authentication for admin panel
// In production, use proper authentication (NextAuth, Clerk, etc.)

// Get password from environment or use default
function getAdminPassword(): string {
  // Check environment variable
  if (typeof process !== "undefined" && process.env?.ADMIN_PASSWORD) {
    return process.env.ADMIN_PASSWORD;
  }
  // Default password for development
  return "admin123";
}

export function checkAuth(password: string): boolean {
  if (!password) {
    return false;
  }
  const adminPassword = getAdminPassword();
  return password === adminPassword;
}

export function setAuthCookie() {
  // In a real app, use httpOnly cookies
  // For now, we'll use a simple approach
  return true;
}
