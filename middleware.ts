import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define protected routes and their required roles
const protectedRoutes = {
  "/admin-dashboard": ["admin"],
  "/manager-dashboard": ["admin", "moderator"],
  "/user-dashboard": ["admin", "moderator", "user"],
  "/api/admin": ["admin"],
  "/api/moderator": ["admin", "moderator"],
} as const;

// Define public routes that don't require authentication
const publicRoutes = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/error",
  "/api/auth",
  "/api/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  // Public project listing endpoints and page
  "/projects",
  "/api/projects*",
];

// Helper function to check if a route is public
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => {
    if (route.endsWith("*")) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

// Helper function to check if user has required role for a route
function hasRequiredRole(userRole: string, pathname: string): boolean {
  for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route)) {
      return allowedRoles.includes(userRole as any);
    }
  }
  return true; // Allow access if no specific role requirement
}

// Helper function to get redirect URL based on user role
function getRoleBasedRedirect(userRole: string): string {
  switch (userRole) {
    case "admin":
      return "/admin-dashboard";
    case "moderator":
      return "/manager-dashboard";
    case "user":
      return "/user-dashboard";
    default:
      return "/auth/login";
  }
}

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Allow public routes
    if (isPublicRoute(pathname)) {
      return NextResponse.next();
    }

    // Redirect unauthenticated users to login
    if (!token) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check role-based access
    const userRole = token.role as string;
    if (!hasRequiredRole(userRole, pathname)) {
      // Redirect to appropriate dashboard or unauthorized page
      const redirectUrl = new URL("/unauthorized", req.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Redirect root path to role-based dashboard
    if (pathname === "/" && token) {
      const dashboardUrl = new URL(getRoleBasedRedirect(userRole), req.url);
      return NextResponse.redirect(dashboardUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow public routes without token
        if (isPublicRoute(pathname)) {
          return true;
        }

        // Require token for protected routes
        return !!token;
      },
    },
  }
);

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
