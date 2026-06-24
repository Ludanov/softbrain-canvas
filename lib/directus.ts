import { createDirectus, rest, readItems } from '@directus/sdk';

// Type definitions for Directus collections
export interface Product {
  id: string;
  status: 'published' | 'draft' | 'archived';
  title: string;
  slug: string;
  description: string;
  price: string | number;
  category: 'coloring-book' | 'sticker' | 'doodle';
  images: string[];
  primary_image: string;
  featured: boolean;
  created_at: string;
  updated_at: string;
  // Product type
  product_type: 'printed' | 'digital';
  digital_file?: string; // File ID for digital downloads
  file_size?: string; // e.g., "25 MB"
  file_format?: string; // e.g., "PDF"
  // Amazon-like fields
  author?: string;
  publisher?: string;
  publication_date?: string;
  language?: string;
  pages?: number;
  dimensions?: string;
  isbn?: string;
  weight?: string;
  best_seller_rank?: number;
  customer_reviews_count?: number;
  average_rating?: number;
  in_stock?: boolean;
  stock_quantity?: number;
}

// Helper to ensure price is a number
export function normalizeProduct(product: Product): Product & { price: number } {
  return {
    ...product,
    price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
  };
}

export interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status?: 'new' | 'read' | 'replied';
  date_created: string;
}

export interface Subscriber {
  id: string;
  email: string;
  status: 'active' | 'unsubscribed';
  source?: string;
  tags?: string[];
  subscribed_at: string;
  created_at?: string;
}

export interface GalleryItem {
  id: string;
  status: 'published' | 'draft';
  title: string;
  description?: string;
  image: string;
  category?: string;
  tags?: string | string[];
  featured?: boolean;
  date_created: string;
  date_updated?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_title: string;
  product_slug: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  customer_id?: string;
  is_guest: boolean;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address_line1: string;
  shipping_address_line2?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  billing_address_line1: string;
  billing_address_line2?: string;
  billing_city: string;
  billing_state: string;
  billing_postal_code: string;
  billing_country: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping_cost: number;
  total: number;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_intent_id?: string;
  notes?: string;
  date_created: string;
  date_updated: string;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  email: string;
  password_hash: string;
  name?: string;
  phone?: string;
  password_reset_token?: string;
  password_reset_expires?: string;
  email_verified?: boolean;
  verification_token?: string;
  verification_token_expires?: string;
  status: 'active' | 'inactive' | 'suspended';
  date_created: string;
  date_updated: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  type: 'shipping' | 'billing';
  is_default: boolean;
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  date_created: string;
  date_updated: string;
}

export interface CustomerFavorite {
  id: string;
  customer_id: string;
  product_id: string;
  date_created: string;
}

export interface BlogPost {
  id: string;
  status: 'published' | 'draft';
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  type: 'article' | 'video' | 'tutorial';
  featured_image?: string;
  video_url?: string;
  author?: string;
  tags?: string[];
  featured?: boolean;
  language?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

// Schema interface for Directus SDK
// Printful Integration Types
export interface PrintfulProduct {
  id: number;
  printful_product_id: number;
  name: string;
  type: string;
  description: string;
  variants: any;
  mockup_url: string;
  status: 'active' | 'inactive';
  date_created: string;
  date_updated: string;
}

export interface PrintfulVariant {
  id: number;
  printful_variant_id: number;
  product_id: number;
  printful_product_id: number;
  name: string;
  size: string;
  color: string;
  price: number;
  retail_price: number;
  sku: string;
  in_stock: boolean;
  date_created: string;
  date_updated: string;
}

export interface PrintfulOrder {
  id: number;
  order_id: number;
  printful_order_id: string;
  status: string;
  tracking_number: string;
  tracking_url: string;
  estimated_delivery: string;
  costs: any;
  error_message: string;
  date_created: string;
  date_updated: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed' | 'free_shipping';
  discount_value: number;
  minimum_order_value?: number;
  max_uses?: number;
  max_uses_per_user?: number;
  times_used: number;
  valid_from?: string;
  valid_until?: string;
  status: 'active' | 'inactive' | 'expired';
  applicable_products?: string[];
  applicable_categories?: string[];
  date_created?: string;
  date_updated?: string;
}

export interface Translation {
  id: string;
  key: string;
  language: string;
  value: string;
  category: string;
  status: 'published' | 'draft' | 'archived';
}

export interface Comment {
  id: string;
  content: string;
  author_name: string;
  author_email?: string;
  author_id?: string;
  customer_id?: string;
  item_type: 'product' | 'gallery' | 'post' | 'comment';
  item_id: string;
  parent_id?: string;
  status: 'pending' | 'approved' | 'spam' | 'trash' | 'deleted';
  created_at: string;
  updated_at?: string;
}

export interface Like {
  id: string;
  user_id: string;
  item_type: 'product' | 'gallery' | 'post' | 'comment';
  item_id: string;
  created_at: string;
}

interface Schema {
  products: Product[];
  gallery_items: GalleryItem[];
  orders: Order[];
  order_items: OrderItem[];
  pages: Page[];
  messages: Message[];
  subscribers: Subscriber[];
  posts: BlogPost[];
  site_customers: Customer[];
  customer_addresses: CustomerAddress[];
  customer_favorites: CustomerFavorite[];
  printful_products: PrintfulProduct[];
  printful_variants: PrintfulVariant[];
  printful_orders: PrintfulOrder[];
  coupons: Coupon[];
  translations: Translation[];
  comments: Comment[];
  likes: Like[];
}

// Create Directus client with REST API
const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:8055';

const directus = createDirectus<Schema>(directusUrl).with(rest());


// Fetch and transform translations for a specific locale
export async function fetchTranslations(locale: string): Promise<Record<string, any>> {
  try {
    const result = await directus.request(
      readItems('translations', {
        filter: {
          language: {
            _eq: locale,
          },
          status: {
            _eq: 'published',
          },
        },
        limit: -1, // Fetch all translations
      })
    );

    // Transform flat [key, value] array to nested object
    // e.g., key="nav.home", value="Home" -> { nav: { home: "Home" } }
    const messages: Record<string, any> = {};

    for (const item of result) {
      if (!item.key || !item.value) continue;

      const keys = item.key.split('.');
      let current = messages;

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (i === keys.length - 1) {
          current[key] = item.value;
        } else {
          current[key] = current[key] || {};
          current = current[key];
        }
      }
    }

    return messages;
  } catch (error) {
    // Silently return empty - local translation files are the primary source
    return {};
  }
}

// Export a getter function for Directus client (for API routes)
export function getDirectusClient() {
  return directus;
}

export default directus;
