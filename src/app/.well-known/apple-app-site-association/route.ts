import { NextResponse } from 'next/server';

/**
 * iOS Universal Links — Apple App Site Association
 *
 * Served at /.well-known/apple-app-site-association
 * Replace the appID with your actual Apple Team ID + Bundle ID.
 */
export async function GET() {
  const association = {
    applinks: {
      apps: [],
      details: [
        {
          // TODO: Replace TEAMID with your Apple Developer Team ID
          appID: 'TEAMID.ma.codelya.vibecart',
          paths: [
            '/*/shop/*',
            '/api/auth/customer/verify',
          ],
        },
      ],
    },
  };

  return NextResponse.json(association, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
