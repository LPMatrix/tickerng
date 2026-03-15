import { auth } from "@/auth";

export default auth((req) => {
  const isSignedIn = !!req.auth;
  const path = req.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/signin") || path.startsWith("/signup");
  const isApiAuth = path.startsWith("/api/auth");

  if (isApiAuth) return;
  if (isAuthRoute && isSignedIn) {
    return Response.redirect(new URL("/", req.nextUrl));
  }
  if (!isAuthRoute && !isSignedIn) {
    return Response.redirect(new URL("/signin", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
