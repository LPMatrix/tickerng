import { auth } from "@/auth";

export default auth((req) => {
  const isSignedIn = !!req.auth;
  const path = req.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/signin") || path.startsWith("/signup");
  const isApiAuth = path.startsWith("/api/auth");
  const isApiShare = path.startsWith("/api/share/");
  const isPublicRoute = path === "/" || path.startsWith("/_next") || path.startsWith("/favicon") || path.startsWith("/r/") || path === "/privacy" || path === "/terms";
  const isAppRoute = path.startsWith("/research");

  if (isApiAuth || isApiShare) return;
  
  // Redirect signed-in users from auth routes to research app
  if (isAuthRoute && isSignedIn) {
    return Response.redirect(new URL("/research", req.nextUrl));
  }
  
  // Allow public access to landing and shared report links
  if (isPublicRoute) return;
  
  // Protect app routes - redirect to signin if not authenticated
  if ((isAppRoute || !isAuthRoute) && !isSignedIn) {
    return Response.redirect(new URL("/signin", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
