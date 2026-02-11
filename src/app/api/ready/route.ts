import { NextResponse } from 'next/server';

/**
 * GET /api/ready
 *
 * Readiness probe endpoint for Kubernetes and container orchestration.
 * Indicates whether the application is ready to accept traffic.
 *
 * This endpoint should be lightweight and only check if the app
 * has finished initialization (e.g., configs loaded, connections pooled).
 *
 * Returns:
 * - 200 OK: Application is ready to accept traffic
 */
export async function GET() {
  const timestamp = new Date().toISOString();

  // Basic readiness check - app is ready if it can respond
  // Add additional checks here if needed (e.g., config loaded, cache warmed)
  const isReady = true;

  const response = {
    ready: isReady,
    timestamp,
  };

  return NextResponse.json(response, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
