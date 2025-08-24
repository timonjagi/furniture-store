import {
  shopifyFetch as originalShopifyFetch,
  getCollections as getShopifyCollections,
  getProducts as getShopifyProducts,
  getCollectionProducts as getShopifyCollectionProducts,
  getProduct as getShopifyProduct,
  createCart,
  addCartLines,
  updateCartLines,
  removeCartLines,
} from './shopify';
import { mockShopifyFetch, getCollections as getMockCollections, getProducts as getMockProducts, getProduct as getMockProduct, getCollectionProducts as getMockCollectionProducts } from './mock';
import { adaptShopifyProduct, adaptShopifyCollection } from './adapters';
import type {
  ShopifyProduct,
  ShopifyCollection,
  Product,
  Collection,
  Cart,
  ProductOption,
  ProductVariant,
  Money,
  ProductCollectionSortKey,
  ProductSortKey,
} from './types';

// Cart adapting happens in server actions to avoid cyclic deps

// Public API functions
export const getCollections = process.env.USE_MOCKS === 'true' ? getMockCollections : async (): Promise<Collection[]> => {
  try {
    const shopifyCollections = await getShopifyCollections();
    return shopifyCollections.map(adaptShopifyCollection);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return [];
  }
};

export async function getCollection(handle: string): Promise<Collection | null> {
  // This function still relies on getCollections, which is now conditionally mocked.
  // So, no direct change needed here, as it will use the correct getCollections.
  try {
    const collections = await getCollections(); // This will now call the correct (mocked or real) getCollections
    const collection = collections.find(collection => collection.handle === handle);
    return collection || null;
  } catch (error) {
    console.error('Error fetching collection:', error);
    return null;
  }
}

export const getProduct: (handle: string) => Promise<Product | null> = process.env.USE_MOCKS === 'true' ? getMockProduct : async (handle: string): Promise<Product | null> => {
  try {
    const shopifyProduct = await getShopifyProduct(handle);
    return shopifyProduct ? adaptShopifyProduct(shopifyProduct) : null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
};

export const getProducts: (params: {
  limit?: number;
  sortKey?: ProductSortKey;
  reverse?: boolean;
  query?: string;
}) => Promise<Product[]> = process.env.USE_MOCKS === 'true' ? getMockProducts : async (params): Promise<Product[]> => {
  try {
    const shopifyProducts = await getShopifyProducts(params);
    return shopifyProducts.map(adaptShopifyProduct);
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export const getCollectionProducts: (params: {
  collection: string;
  limit?: number;
  sortKey?: ProductCollectionSortKey;
  reverse?: boolean;
  query?: string;
}) => Promise<Product[]> = process.env.USE_MOCKS === 'true' ? getMockCollectionProducts : async (params): Promise<Product[]> => {
  try {
    const shopifyProducts = await getShopifyCollectionProducts(params);
    return shopifyProducts.map(adaptShopifyProduct);
  } catch (error) {
    console.error('Error fetching collection products:', error);
    return [];
  }
};

export async function getCart(): Promise<Cart | null> {
  try {
    const { getCart: getCartAction } = await import('@/components/cart/actions');
    return await getCartAction();
  } catch (error) {
    console.error('Error fetching cart:', error);
    return null;
  }
}

// Re-export cart mutation functions (these are properly typed in shopify.ts)
export { createCart, addCartLines, updateCartLines, removeCartLines, adaptShopifyProduct, adaptShopifyCollection };

export const shopifyFetch = process.env.USE_MOCKS === 'true' ? mockShopifyFetch : originalShopifyFetch;
