/**
 * VibeCart Constants
 *
 * Static data for Moroccan locations, mock products, etc.
 * Location data sourced from morocco_addresses project (2024 HCP Census data).
 */

import neighborhoodsData from '@/data/morocco-neighborhoods.json';
import adminDivisionsData from '@/data/morocco-admin-divisions.json';
import type { NeighborhoodsData, AdminDivisionsData } from '@/domain/entities/MoroccoLocation';

// Type the imported data
const neighborhoods = neighborhoodsData as NeighborhoodsData;
const adminDivisions = adminDivisionsData as AdminDivisionsData;

/**
 * Convert city name from uppercase to title case
 * e.g., "CASABLANCA" -> "Casablanca"
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Moroccan Cities and Neighborhoods
 * Transformed from morocco-neighborhoods.json for backward compatibility
 */
export const MOROCCAN_LOCATIONS: Record<string, string[]> = Object.fromEntries(
  Object.entries(neighborhoods).map(([city, hoods]) => [
    toTitleCase(city),
    hoods.map(h => h.neighborhood),
  ])
);

export const MOROCCAN_CITIES = Object.keys(MOROCCAN_LOCATIONS).sort();

/**
 * Moroccan Administrative Divisions (from 2024 HCP Census)
 * 12 regions, 75 provinces, 1529 communes
 */
export const MOROCCAN_REGIONS = Object.keys(adminDivisions.regions).sort();
export const MOROCCAN_PROVINCES = Object.keys(adminDivisions.provinces).sort();
export const MOROCCAN_COMMUNES = Object.keys(adminDivisions.communes).sort();

/**
 * Get provinces for a specific region
 */
export function getProvincesForRegion(region: string): string[] {
  return adminDivisions.regions[region]?.provinces || [];
}

/**
 * Get communes for a specific province
 */
export function getCommunesForProvince(province: string): string[] {
  return adminDivisions.provinces[province]?.communes || [];
}

/**
 * Get region for a province
 */
export function getRegionForProvince(province: string): string | null {
  return adminDivisions.provinces[province]?.region || null;
}

/**
 * Get province centroid (lat, lng)
 */
export function getProvinceCentroid(province: string): number[] | null {
  return adminDivisions.provinces[province]?.centroid || null;
}

/**
 * Get region details with both French and Arabic names
 */
export function getRegionDetails(region: string): { name_fr: string; name_ar: string } | null {
  const r = adminDivisions.regions[region];
  return r ? { name_fr: r.name_fr, name_ar: r.name_ar } : null;
}

/**
 * Get province details with both French and Arabic names
 */
export function getProvinceDetails(province: string): { name_fr: string; name_ar: string; region: string } | null {
  const p = adminDivisions.provinces[province];
  return p ? { name_fr: p.name_fr, name_ar: p.name_ar, region: p.region } : null;
}

/**
 * Get commune details with both French and Arabic names
 */
export function getCommuneDetails(commune: string): { name_fr: string; name_ar: string; province: string; region: string } | null {
  const c = adminDivisions.communes[commune];
  return c ? { name_fr: c.name_fr, name_ar: c.name_ar, province: c.province, region: c.region } : null;
}

/**
 * Get all regions with both names for dropdown
 */
export function getAllRegions(): Array<{ key: string; name_fr: string; name_ar: string }> {
  return Object.entries(adminDivisions.regions)
    .map(([key, r]) => ({ key, name_fr: r.name_fr, name_ar: r.name_ar }))
    .sort((a, b) => a.name_fr.localeCompare(b.name_fr));
}

/**
 * Get provinces for a region with both names
 */
export function getProvincesForRegionWithNames(region: string): Array<{ key: string; name_fr: string; name_ar: string }> {
  const provinces = adminDivisions.regions[region]?.provinces || [];
  return provinces
    .map(p => {
      const details = adminDivisions.provinces[p];
      return details ? { key: p, name_fr: details.name_fr, name_ar: details.name_ar } : null;
    })
    .filter((p): p is { key: string; name_fr: string; name_ar: string } => p !== null)
    .sort((a, b) => a.name_fr.localeCompare(b.name_fr));
}

/**
 * Get communes for a province with both names
 */
export function getCommunesForProvinceWithNames(province: string): Array<{ key: string; name_fr: string; name_ar: string }> {
  const communes = adminDivisions.provinces[province]?.communes || [];
  return communes
    .map(c => {
      const details = adminDivisions.communes[c];
      return details ? { key: c, name_fr: details.name_fr, name_ar: details.name_ar } : null;
    })
    .filter((c): c is { key: string; name_fr: string; name_ar: string } => c !== null)
    .sort((a, b) => a.name_fr.localeCompare(b.name_fr));
}

/**
 * Get neighborhoods for a city (from neighborhoods data)
 */
export function getNeighborhoodsForCity(city: string): string[] {
  // Try exact match first
  if (neighborhoods[city]) {
    return neighborhoods[city].map(n => n.neighborhood).sort();
  }
  // Try uppercase match
  const upperCity = city.toUpperCase();
  if (neighborhoods[upperCity]) {
    return neighborhoods[upperCity].map(n => n.neighborhood).sort();
  }
  // Try case-insensitive match
  const found = Object.keys(neighborhoods).find(
    k => k.toLowerCase() === city.toLowerCase()
  );
  if (found) {
    return neighborhoods[found].map(n => n.neighborhood).sort();
  }
  return [];
}

/**
 * Normalize text for matching (handles accents, case, etc.)
 */
function normalizeForMatching(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/['']/g, "'")
    .replace(/[-_]/g, ' ')
    .trim();
}

/**
 * Try to match a city name to a province/commune
 */
export function matchCityToAdminDivision(city: string): {
  region?: { key: string; name_fr: string; name_ar: string };
  province?: { key: string; name_fr: string; name_ar: string };
  commune?: { key: string; name_fr: string; name_ar: string };
} | null {
  if (!city) return null;

  const normalizedCity = normalizeForMatching(city);

  // Check normalization map first
  const normalized = adminDivisions.normalization[city] || adminDivisions.normalization[normalizedCity];
  const searchTerm = normalized || normalizedCity;

  // Try to match commune
  for (const [key, c] of Object.entries(adminDivisions.communes)) {
    if (normalizeForMatching(key) === searchTerm ||
        normalizeForMatching(c.name_fr) === searchTerm) {
      const province = adminDivisions.provinces[c.province];
      const region = adminDivisions.regions[c.region];
      return {
        commune: { key, name_fr: c.name_fr, name_ar: c.name_ar },
        province: province ? { key: c.province, name_fr: province.name_fr, name_ar: province.name_ar } : undefined,
        region: region ? { key: c.region, name_fr: region.name_fr, name_ar: region.name_ar } : undefined,
      };
    }
  }

  // Try to match province
  for (const [key, p] of Object.entries(adminDivisions.provinces)) {
    if (normalizeForMatching(key) === searchTerm ||
        normalizeForMatching(p.name_fr) === searchTerm) {
      const region = adminDivisions.regions[p.region];
      return {
        province: { key, name_fr: p.name_fr, name_ar: p.name_ar },
        region: region ? { key: p.region, name_fr: region.name_fr, name_ar: region.name_ar } : undefined,
      };
    }
  }

  // Try to match region
  for (const [key, r] of Object.entries(adminDivisions.regions)) {
    if (normalizeForMatching(key) === searchTerm ||
        normalizeForMatching(r.name_fr) === searchTerm) {
      return {
        region: { key, name_fr: r.name_fr, name_ar: r.name_ar },
      };
    }
  }

  return null;
}

// Product Categories
export const PRODUCT_CATEGORIES = [
  'clothing',
  'shoes',
  'jewelry',
  'beauty',
  'home',
  'other',
] as const;

export type ProductCategoryType = (typeof PRODUCT_CATEGORIES)[number];
