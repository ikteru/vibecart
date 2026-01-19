/**
 * Morocco Location Types
 *
 * Type definitions for Moroccan administrative divisions and landmarks
 * based on 2024 HCP Census data.
 */

/**
 * Landmark types available in the morocco-landmarks dataset
 */
export type LandmarkType =
  | 'school'
  | 'pharmacy'
  | 'mosque'
  | 'clinic'
  | 'hospital'
  | 'bank'
  | 'post_office'
  | 'bus_stop'
  | 'government'
  | 'other';

/**
 * Address structure within a landmark
 */
export interface LandmarkAddress {
  street: string;
  quartier: string;
  postal_code: string;
  city: string;
  province: string;
  province_ar: string;
  region: string;
}

/**
 * Contact information for a landmark
 */
export interface LandmarkContact {
  phone: string;
  email: string;
}

/**
 * Full landmark data as stored in morocco-landmarks.json
 */
export interface Landmark {
  id: string;
  name: string;
  name_ar: string;
  type: LandmarkType;
  lat: number;
  lng: number;
  address: LandmarkAddress;
  contact: LandmarkContact;
  source: string;
  reliability: number;
  grid_cell: string;
}

/**
 * Simplified landmark for API responses (nearby landmarks)
 */
export interface NearbyLandmark {
  id: string;
  name: string;
  name_ar: string;
  type: LandmarkType;
  distance: number; // meters
  lat: number;
  lng: number;
}

/**
 * Landmarks JSON file structure
 */
export interface LandmarksData {
  landmarks: Landmark[];
}

/**
 * Neighborhood entry in neighborhoods.json
 */
export interface Neighborhood {
  neighborhood: string;
  postalCode: string;
}

/**
 * Neighborhoods JSON file structure: city -> neighborhoods[]
 */
export type NeighborhoodsData = Record<string, Neighborhood[]>;

/**
 * Region in admin_divisions.json
 */
export interface Region {
  name_fr: string;
  name_ar: string;
  iso: string;
  provinces: string[];
}

/**
 * Province in admin_divisions.json
 */
export interface Province {
  name_fr: string;
  name_ar: string;
  iso: string;
  region: string;
  communes: string[];
  centroid: number[];
}

/**
 * Commune in admin_divisions.json
 */
export interface Commune {
  name_fr: string;
  name_ar: string;
  iso: string;
  province: string;
  region: string;
  centroid: number[];
}

/**
 * Admin divisions JSON file structure
 */
export interface AdminDivisionsData {
  metadata: {
    source: string;
    total_regions: number;
    total_provinces: number;
    total_communes: number;
    normalization_entries: number;
  };
  regions: Record<string, Region>;
  provinces: Record<string, Province>;
  communes: Record<string, Commune>;
  normalization: Record<string, string>;
}
