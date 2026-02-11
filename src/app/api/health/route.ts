import { NextResponse } from 'next/server';
import { createAdminClient } from '@/infrastructure/auth/supabase-server';

/**
 * GET /api/health
 *
 * Health check endpoint for monitoring and load balancers.
 * Checks database connectivity and returns overall system health status.
 *
 * Returns:
 * - 200 OK: All health checks passed
 * - 503 Service Unavailable: One or more health checks failed
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  const version = process.env.npm_package_version || '0.1.0';

  const checks: Record<string, 'ok' | 'error'> = {
    database: 'ok',
  };

  let isHealthy = true;

  // Check database connectivity
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('sellers').select('id').limit(1);

    if (error) {
      console.error('Health check: Database connection failed:', error);
      checks.database = 'error';
      isHealthy = false;
    }
  } catch (error) {
    console.error('Health check: Database connection error:', error);
    checks.database = 'error';
    isHealthy = false;
  }

  const response = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp,
    version,
    checks,
  };

  return NextResponse.json(response, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
