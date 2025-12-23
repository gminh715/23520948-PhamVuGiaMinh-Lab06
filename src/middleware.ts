import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiting for Edge Runtime
// In production, use Redis or a distributed cache
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_REQUESTS || '10', 10);
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);

function getRateLimitInfo(ip: string) {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now - record.timestamp > WINDOW_MS) {
        // Reset or create new record
        rateLimitMap.set(ip, { count: 1, timestamp: now });
        return { allowed: true, remaining: RATE_LIMIT - 1 };
    }

    if (record.count >= RATE_LIMIT) {
        const resetTime = record.timestamp + WINDOW_MS - now;
        return { allowed: false, remaining: 0, resetTime };
    }

    record.count++;
    return { allowed: true, remaining: RATE_LIMIT - record.count };
}

export function middleware(request: NextRequest) {
    // Only apply rate limiting to AI API routes
    if (request.nextUrl.pathname.startsWith('/api/chat')) {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            'anonymous';

        const { allowed, remaining, resetTime } = getRateLimitInfo(ip);

        if (!allowed) {
            return NextResponse.json(
                {
                    error: 'Rate limit exceeded',
                    message: `Too many requests. Please try again in ${Math.ceil((resetTime || 0) / 1000)} seconds.`,
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': String(RATE_LIMIT),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(Date.now() + (resetTime || 0)),
                        'Retry-After': String(Math.ceil((resetTime || 0) / 1000)),
                    },
                }
            );
        }

        // Add rate limit headers to successful responses
        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT));
        response.headers.set('X-RateLimit-Remaining', String(remaining));
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/api/chat/:path*'],
};
