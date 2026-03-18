import { NextResponse } from 'next/server';

/**
 * Android App Links — Digital Asset Links
 *
 * Served at /.well-known/assetlinks.json
 * Replace the SHA-256 fingerprint with your actual signing key.
 */
export async function GET() {
  const assetLinks = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'ma.codelya.vibecart',
        sha256_cert_fingerprints: [
          // TODO: Replace with actual signing key fingerprint
          // Run: keytool -list -v -keystore your-keystore.jks
          'PLACEHOLDER:REPLACE:WITH:ACTUAL:SHA256:FINGERPRINT',
        ],
      },
    },
  ];

  return NextResponse.json(assetLinks, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
