import { UserRole } from '@/models/User';

/**
 * Maps user roles to their respective dashboard routes
 */
export const ROLE_DASHBOARD_MAP: Record<UserRole, string> = {
  admin: '/admin-dashboard',
  moderator: '/manager-dashboard', // Using manager-dashboard for moderators
  user: '/user-dashboard',
};

/**
 * Gets the appropriate dashboard route for a user's role
 * @param role - The user's role
 * @returns The dashboard route path
 */
export function getDashboardRoute(role: UserRole): string {
  return ROLE_DASHBOARD_MAP[role] || ROLE_DASHBOARD_MAP.user;
}

/**
 * Redirects user to their role-based dashboard
 * @param role - The user's role
 * @param fallback - Fallback route if role is not found (default: /user-dashboard)
 * @returns The redirect URL
 */
export function getRedirectUrl(role: UserRole, fallback: string = '/user-dashboard'): string {
  return ROLE_DASHBOARD_MAP[role] || fallback;
}

/**
 * Checks if a user has access to a specific route
 * @param userRole - The user's role
 * @param requestedRoute - The route being accessed
 * @returns True if user has access, false otherwise
 */
export function hasRouteAccess(userRole: UserRole, requestedRoute: string): boolean {
  // Get all navigation items for the user's role
  const userNavigation = getRoleBasedNavigation(userRole);
  const allowedRoutes = userNavigation.map(item => item.route);
  
  // Users can access any route in their navigation
  if (allowedRoutes.includes(requestedRoute)) {
    return true;
  }
  
  // Admins can access all dashboard routes
  if (userRole === 'admin') {
    return Object.values(ROLE_DASHBOARD_MAP).includes(requestedRoute) || allowedRoutes.includes(requestedRoute);
  }
  
  // Moderators can access user dashboard and their own routes
  if (userRole === 'moderator' && (requestedRoute === ROLE_DASHBOARD_MAP.user || allowedRoutes.includes(requestedRoute))) {
    return true;
  }
  
  return false;
}

/**
 * Gets navigation items based on user role
 * @param role - The user's role
 * @returns Array of navigation items with routes and labels
 */
export function getRoleBasedNavigation(role: UserRole) {
  const baseNavigation = [
    { route: '/user-dashboard', label: 'Dashboard', icon: 'dashboard' },
    { route: '/my-projects', label: 'My Projects', icon: 'folder' },
    { route: '/profile', label: 'Profile', icon: 'user' },
  ];

  const moderatorNavigation = [
    ...baseNavigation,
    { route: '/manager-dashboard', label: 'Management', icon: 'settings' },
    { route: '/reports', label: 'Reports', icon: 'chart' },
  ];

  const adminNavigation = [
    ...moderatorNavigation,
    { route: '/admin-dashboard', label: 'Admin Panel', icon: 'shield' },
    { route: '/users', label: 'User Management', icon: 'users' },
    { route: '/system', label: 'System Settings', icon: 'cog' },
  ];

  switch (role) {
    case 'admin':
      return adminNavigation;
    case 'moderator':
      return moderatorNavigation;
    case 'user':
    default:
      return baseNavigation;
  }
}