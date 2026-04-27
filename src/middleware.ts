import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/signin(.*)",
  "/signup(.*)",
  "/r/(.*)",
  "/privacy",
  "/terms",
  "/robots.txt",
  "/sitemap.xml",
  "/opengraph-image",
  "/twitter-image",
  "/api/share/(.*)",
  "/api/billing/callback",
  "/api/webhooks/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  if (
    userId &&
    (req.nextUrl.pathname.startsWith("/signin") || req.nextUrl.pathname.startsWith("/signup"))
  ) {
    return NextResponse.redirect(new URL("/research", req.url));
  }
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
