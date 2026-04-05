/**
 * Check whether the user holds a specific role.
 */
export function requireRole(userRoles: string[], requiredRole: string): boolean {
  return userRoles.includes(requiredRole);
}

/**
 * Check whether the user holds at least one of the required roles.
 */
export function requireAnyRole(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some((role) => userRoles.includes(role));
}
