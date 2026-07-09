import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(request: NextRequest): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1";
  return ip;
}

function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);

  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining, resetAt: entry.resetAt };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const rateLimitConfig: Record<string, { max: number; windowMs: number }> = {
    "/api/upload": { max: 30, windowMs: 60_000 },
    "/api/history": { max: 100, windowMs: 60_000 },
    "/api/models": { max: 200, windowMs: 60_000 },
  };

  const config = rateLimitConfig[pathname] ?? { max: 100, windowMs: 60_000 };

  const key = getRateLimitKey(request);
  const { allowed, remaining, resetAt } = checkRateLimit(
    key,
    config.max,
    config.windowMs,
  );

  const response = allowed
    ? NextResponse.next()
    : NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
          },
        },
      );

  response.headers.set("X-RateLimit-Limit", String(config.max));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
