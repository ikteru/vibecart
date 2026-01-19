/**
 * Nearby Landmarks API Route
 *
 * Returns landmarks within a specified radius of given coordinates.
 * Uses Haversine formula for accurate distance calculation.
 *
 * GET /api/landmarks/nearby?lat=33.57&lng=-7.59&radius=500&limit=5
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { LandmarksData, NearbyLandmark, Landmark } from '@/domain/entities/MoroccoLocation';

// Cache the landmarks data in memory after first load
let cachedLandmarks: Landmark[] | null = null;

/**
 * Load landmarks data from JSON file (cached after first load)
 */
async function getLandmarks(): Promise<Landmark[]> {
  if (cachedLandmarks) {
    return cachedLandmarks;
  }

  const filePath = path.join(process.cwd(), 'src/data/morocco-landmarks.json');
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const data: LandmarksData = JSON.parse(fileContent);
  cachedLandmarks = data.landmarks;
  return cachedLandmarks;
}

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in meters
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse parameters
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseInt(searchParams.get('radius') || '500', 10);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    // Validate coordinates
    if (lat === 0 && lng === 0) {
      return NextResponse.json(
        { error: 'Valid latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Validate Morocco bounds (rough check)
    if (lat < 21 || lat > 36 || lng < -17 || lng > -1) {
      return NextResponse.json({ landmarks: [] });
    }

    const landmarks = await getLandmarks();

    // Calculate distances and filter by radius
    const nearby: NearbyLandmark[] = landmarks
      .map((l) => ({
        id: l.id,
        name: l.name,
        name_ar: l.name_ar,
        type: l.type,
        lat: l.lat,
        lng: l.lng,
        distance: haversineDistance(lat, lng, l.lat, l.lng),
      }))
      .filter((l) => l.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)
      .map((l) => ({
        ...l,
        distance: Math.round(l.distance),
      }));

    return NextResponse.json({ landmarks: nearby });
  } catch (error) {
    console.error('Error fetching nearby landmarks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
