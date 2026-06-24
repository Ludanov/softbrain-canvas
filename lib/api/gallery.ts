import { GalleryItem } from '../directus';

export interface GalleryFilters {
  category?: string;
  tags?: string[];
  status?: 'published' | 'draft';
}

/**
 * Fetch all gallery items with optional filtering
 * Uses the Next.js API route proxy to avoid CORS issues
 */
export async function getGalleryItems(
  filters?: GalleryFilters
): Promise<GalleryItem[]> {
  try {
    const params = new URLSearchParams();
    params.append('status', 'published');
    
    if (filters?.category) {
      params.set('category', filters.category);
    }

    const response = await fetch(`/api/gallery?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch gallery items: ${response.status}`);
    }

    const items = await response.json();
    return items as unknown as GalleryItem[];
  } catch (error) {
    console.error('Error fetching gallery items:', error);
    // Return empty array instead of throwing to prevent page crash
    return [];
  }
}

/**
 * Fetch gallery items by category
 */
export async function getGalleryItemsByCategory(
  category: string
): Promise<GalleryItem[]> {
  return getGalleryItems({ category });
}

/**
 * Fetch gallery items by tags
 */
export async function getGalleryItemsByTags(
  tags: string[]
): Promise<GalleryItem[]> {
  return getGalleryItems({ tags });
}

/**
 * Fetch a single gallery item by ID
 */
export async function getGalleryItem(id: string): Promise<GalleryItem | null> {
  try {
    const response = await fetch(`/api/gallery?id=${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch gallery item: ${response.status}`);
    }

    const items = await response.json();
    if (!items || items.length === 0) {
      return null;
    }

    return items[0] as unknown as GalleryItem;
  } catch (error) {
    console.error(`Error fetching gallery item with id ${id}:`, error);
    // Return null instead of throwing
    return null;
  }
}
