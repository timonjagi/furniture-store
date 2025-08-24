import shopifyData from './shopify-data.json';
import { ShopifyCart, ShopifyCollection, ShopifyProduct, ShopifyCartLineEdge, Product, Collection } from '../types';
import { adaptShopifyProduct, adaptShopifyCollection } from '../adapters';
import { shopifyFetch as originalShopifyFetch } from '../shopify'; // Keep original shopifyFetch for potential internal use in mocks if needed, though not currently used.

type MockShopifyData = typeof shopifyData & {
  carts: Record<string, ShopifyCart>;
};

const mockShopifyData: MockShopifyData = JSON.parse(JSON.stringify(shopifyData));

// Helper to simulate GraphQL responses
function createGraphQLResponse<T>(data: T, errors?: any[]) {
  return { data, errors };
}

// Mock shopifyFetch function
export async function mockShopifyFetch<T>({
  query,
  variables = {},
}: {
  query: string;
  variables?: Record<string, any>;
}): Promise<{ data: T; errors?: any[] }> {
  console.log('Mock Shopify Fetch called with:', { query, variables });

  // Mock getProducts
  if (query.includes('query getProducts')) {
    const { first, sortKey, reverse, query: searchQuery } = variables;
    let products = [...mockShopifyData.products];

    if (searchQuery) {
      products = products.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Basic sorting mock (can be expanded)
    if (sortKey === 'TITLE') {
      products.sort((a, b) => (reverse ? b.title.localeCompare(a.title) : a.title.localeCompare(b.title)));
    }

    const edges = products.slice(0, first).map(node => ({ node: adaptShopifyProduct(node) }));
    return createGraphQLResponse({ products: { edges } }) as { data: T; errors?: any[] };
  }

  // Mock getProduct
  if (query.includes('query getProduct')) {
    const { handle } = variables;
    const product = mockShopifyData.products.find(p => p.handle === handle);
    return createGraphQLResponse({ product: product ? adaptShopifyProduct(product) : null }) as { data: T; errors?: any[] };
  }

  // Mock getCollections
  if (query.includes('query getCollections')) {
    const { first } = variables;
    const edges = mockShopifyData.collections.slice(0, first).map(node => ({ node: adaptShopifyCollection(node) }));
    return createGraphQLResponse({ collections: { edges } }) as { data: T; errors?: any[] };
  }

  // Mock getCollectionProducts
  if (query.includes('query getCollectionProducts')) {
    const { handle, first, sortKey, reverse, query: searchQuery } = variables;
    const collection = mockShopifyData.collections.find(c => c.handle === handle);

    if (!collection) {
      return createGraphQLResponse({ collection: null }) as { data: T; errors?: any[] };
    }

    let productsInCollection = [...mockShopifyData.products]; // For simplicity, all products are in all collections in mock

    if (searchQuery) {
      productsInCollection = productsInCollection.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Basic sorting mock (can be expanded)
    if (sortKey === 'TITLE') {
      productsInCollection.sort((a, b) => (reverse ? b.title.localeCompare(a.title) : a.title.localeCompare(b.title)));
    }

    const edges = productsInCollection.slice(0, first).map(node => ({ node: adaptShopifyProduct(node) }));
    return createGraphQLResponse({ collection: { products: { edges } } }) as { data: T; errors?: any[] };
  }

  // Mock createCart
  if (query.includes('mutation cartCreate')) {
    const newCartId = `gid://shopify/Cart/${Object.keys(mockShopifyData.carts).length + 1}`;
    const newCart: ShopifyCart = {
      id: newCartId,
      lines: { edges: [] },
      cost: {
        totalAmount: { amount: '0.00', currencyCode: 'USD' },
        subtotalAmount: { amount: '0.00', currencyCode: 'USD' },
        totalTaxAmount: { amount: '0.00', currencyCode: 'USD' },
      },
      checkoutUrl: `https://mock-shopify.com/cart/${newCartId}/checkout`,
    };
    mockShopifyData.carts[newCartId] = newCart;
    return createGraphQLResponse({ cartCreate: { cart: newCart, userErrors: [] } }) as { data: T; errors?: any[] };
  }

  // Mock addCartLines
  if (query.includes('mutation cartLinesAdd')) {
    const { cartId, lines } = variables;
    const cart = mockShopifyData.carts[cartId];

    if (!cart) {
      return createGraphQLResponse({ cartLinesAdd: { cart: null, userErrors: [{ field: 'cartId', message: 'Cart not found' }] } }) as { data: T; errors?: any[] };
    }

    lines.forEach((newLine: { merchandiseId: string; quantity: number }) => {
      const existingLineIndex = cart.lines.edges.findIndex(
        (edge: ShopifyCartLineEdge) => (edge.node.merchandise as any).id === newLine.merchandiseId
      );

      if (existingLineIndex > -1) {
        cart.lines.edges[existingLineIndex].node.quantity += newLine.quantity;
      } else {
        // Find product variant to get details
        let merchandise: any = null;
        for (const product of mockShopifyData.products) {
          const variant = product.variants.edges.find(v => v.node.id === newLine.merchandiseId);
          if (variant) {
            merchandise = {
              id: variant.node.id,
              title: variant.node.title,
              price: variant.node.price,
              product: {
                title: product.title,
                images: product.images,
              },
            };
            break;
          }
        }

        if (merchandise) {
          cart.lines.edges.push({
            node: {
              id: `gid://shopify/CartLine/${cart.lines.edges.length + 1}`,
              quantity: newLine.quantity,
              merchandise,
            },
          });
        }
      }
    });

    // Recalculate total amount (simplified)
    cart.cost.totalAmount.amount = cart.lines.edges
      .reduce((sum: number, line: ShopifyCartLineEdge) => sum + parseFloat((line.node.merchandise as any).price.amount) * line.node.quantity, 0)
      .toFixed(2);

    return createGraphQLResponse({ cartLinesAdd: { cart, userErrors: [] } }) as { data: T; errors?: any[] };
  }

  // Mock updateCartLines
  if (query.includes('mutation cartLinesUpdate')) {
    const { cartId, lines } = variables;
    const cart = mockShopifyData.carts[cartId];

    if (!cart) {
      return createGraphQLResponse({ cartLinesUpdate: { cart: null, userErrors: [{ field: 'cartId', message: 'Cart not found' }] } }) as { data: T; errors?: any[] };
    }

    lines.forEach((updateLine: { id: string; quantity: number }) => {
      const lineIndex = cart.lines.edges.findIndex((edge: ShopifyCartLineEdge) => edge.node.id === updateLine.id);
      if (lineIndex > -1) {
        cart.lines.edges[lineIndex].node.quantity = updateLine.quantity;
      }
    });

    // Recalculate total amount (simplified)
    cart.cost.totalAmount.amount = cart.lines.edges
      .reduce((sum: number, line: ShopifyCartLineEdge) => sum + parseFloat((line.node.merchandise as any).price.amount) * line.node.quantity, 0)
      .toFixed(2);

    return createGraphQLResponse({ cartLinesUpdate: { cart, userErrors: [] } }) as { data: T; errors?: any[] };
  }

  // Mock removeCartLines
  if (query.includes('mutation cartLinesRemove')) {
    const { cartId, lineIds } = variables;
    const cart = mockShopifyData.carts[cartId];

    if (!cart) {
      return createGraphQLResponse({ cartLinesRemove: { cart: null, userErrors: [{ field: 'cartId', message: 'Cart not found' }] } }) as { data: T; errors?: any[] };
    }

    cart.lines.edges = cart.lines.edges.filter((edge: ShopifyCartLineEdge) => !lineIds.includes(edge.node.id));

    // Recalculate total amount (simplified)
    cart.cost.totalAmount.amount = cart.lines.edges
      .reduce((sum: number, line: ShopifyCartLineEdge) => sum + parseFloat((line.node.merchandise as any).price.amount) * line.node.quantity, 0)
      .toFixed(2);

    return createGraphQLResponse({ cartLinesRemove: { cart, userErrors: [] } }) as { data: T; errors?: any[] };
  }

  // Mock getCart
  if (query.includes('query getCart')) {
    const { cartId } = variables;
    const cart = mockShopifyData.carts[cartId] || null;
    return createGraphQLResponse({ cart }) as { data: T; errors?: any[] };
  }

  // Fallback for unmocked queries
  console.warn('Unmocked Shopify GraphQL query:', query);
  return createGraphQLResponse({} as T, [{ message: 'Unmocked query' }]);
}

// Mock getCollections function
export async function getCollections(): Promise<Collection[]> {
  console.log('Mock getCollections called');
  return mockShopifyData.collections.map(adaptShopifyCollection);
}

// Mock getProducts function
export async function getProducts(params: {
  first?: number;
  sortKey?: string;
  reverse?: boolean;
  query?: string;
}): Promise<Product[]> {
  console.log('Mock getProducts called with:', params);
  let products = [...mockShopifyData.products];

  if (params.query) {
    products = products.filter(p => p.title.toLowerCase().includes(params.query!.toLowerCase()));
  }

  if (params.sortKey === 'TITLE') {
    products.sort((a, b) => (params.reverse ? b.title.localeCompare(a.title) : a.title.localeCompare(b.title)));
  }

  return products.slice(0, params.first || products.length).map(adaptShopifyProduct);
}

// Mock getProduct function
export async function getProduct(handle: string): Promise<Product | null> {
  console.log('Mock getProduct called with handle:', handle);
  const product = mockShopifyData.products.find(p => p.handle === handle);
  return product ? adaptShopifyProduct(product) : null;
}

// Mock getCollectionProducts function
export async function getCollectionProducts(params: {
  collection: string;
  limit?: number;
  sortKey?: string;
  reverse?: boolean;
  query?: string;
}): Promise<Product[]> {
  console.log('Mock getCollectionProducts called with:', params);
  const collection = mockShopifyData.collections.find(c => c.handle === params.collection);

  if (!collection) {
    return [];
  }

  let productsInCollection = mockShopifyData.products.filter(product =>
    product.productType.toLowerCase() === collection.handle.toLowerCase() || product.featured === true && collection.handle === 'featured'
  );

  if (params.query) {
    productsInCollection = productsInCollection.filter(p => p.title.toLowerCase().includes(params.query!.toLowerCase()));
  }

  if (params.sortKey === 'TITLE') {
    productsInCollection.sort((a, b) => (params.reverse ? b.title.localeCompare(a.title) : a.title.localeCompare(b.title)));
  }

  return productsInCollection.slice(0, params.limit || productsInCollection.length).map(adaptShopifyProduct);
}

// Mock createCart function
export async function createCart(): Promise<ShopifyCart> {
  console.log('Mock createCart called');
  const newCartId = `gid://shopify/Cart/${Object.keys(mockShopifyData.carts).length + 1}`;
  const newCart: ShopifyCart = {
    id: newCartId,
    lines: { edges: [] },
    cost: {
      totalAmount: { amount: '0.00', currencyCode: 'USD' },
      subtotalAmount: { amount: '0.00', currencyCode: 'USD' },
      totalTaxAmount: { amount: '0.00', currencyCode: 'USD' },
    },
    checkoutUrl: `https://mock-shopify.com/cart/${newCartId}/checkout`,
  };
  mockShopifyData.carts[newCartId] = newCart;
  return newCart;
}

// Mock addCartLines function
export async function addCartLines(
  cartId: string,
  lines: Array<{ merchandiseId: string; quantity: number }>
): Promise<ShopifyCart> {
  console.log('Mock addCartLines called with:', { cartId, lines });
  const cart = mockShopifyData.carts[cartId];

  if (!cart) {
    throw new Error('Cart not found');
  }

  lines.forEach((newLine) => {
    const existingLineIndex = cart.lines.edges.findIndex(
      (edge: ShopifyCartLineEdge) => (edge.node.merchandise as any).id === newLine.merchandiseId
    );

    if (existingLineIndex > -1) {
      cart.lines.edges[existingLineIndex].node.quantity += newLine.quantity;
    } else {
      let merchandise: any = null;
      for (const product of mockShopifyData.products) {
        const variant = product.variants.edges.find(v => v.node.id === newLine.merchandiseId);
        if (variant) {
          merchandise = {
            id: variant.node.id,
            title: variant.node.title,
            price: variant.node.price,
            product: {
              title: product.title,
              images: product.images,
            },
          };
          break;
        }
      }

      if (merchandise) {
        cart.lines.edges.push({
          node: {
            id: `gid://shopify/CartLine/${cart.lines.edges.length + 1}`,
            quantity: newLine.quantity,
            merchandise,
          },
        });
      }
    }
  });

  cart.cost.totalAmount.amount = cart.lines.edges
    .reduce((sum: number, line: ShopifyCartLineEdge) => sum + parseFloat((line.node.merchandise as any).price.amount) * line.node.quantity, 0)
    .toFixed(2);

  return cart;
}

// Mock updateCartLines function
export async function updateCartLines(
  cartId: string,
  lines: Array<{ id: string; quantity: number }>
): Promise<ShopifyCart> {
  console.log('Mock updateCartLines called with:', { cartId, lines });
  const cart = mockShopifyData.carts[cartId];

  if (!cart) {
    throw new Error('Cart not found');
  }

  lines.forEach((updateLine) => {
    const lineIndex = cart.lines.edges.findIndex((edge: ShopifyCartLineEdge) => edge.node.id === updateLine.id);
    if (lineIndex > -1) {
      cart.lines.edges[lineIndex].node.quantity = updateLine.quantity;
    }
  });

  cart.cost.totalAmount.amount = cart.lines.edges
    .reduce((sum: number, line: ShopifyCartLineEdge) => sum + parseFloat((line.node.merchandise as any).price.amount) * line.node.quantity, 0)
    .toFixed(2);

  return cart;
}

// Mock removeCartLines function
export async function removeCartLines(cartId: string, lineIds: string[]): Promise<ShopifyCart> {
  console.log('Mock removeCartLines called with:', { cartId, lineIds });
  const cart = mockShopifyData.carts[cartId];

  if (!cart) {
    throw new Error('Cart not found');
  }

  cart.lines.edges = cart.lines.edges.filter((edge: ShopifyCartLineEdge) => !lineIds.includes(edge.node.id));

  cart.cost.totalAmount.amount = cart.lines.edges
    .reduce((sum: number, line: ShopifyCartLineEdge) => sum + parseFloat((line.node.merchandise as any).price.amount) * line.node.quantity, 0)
    .toFixed(2);

  return cart;
}

// Mock getCart function
export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  console.log('Mock getCart called with cartId:', cartId);
  return mockShopifyData.carts[cartId] || null;
}

// Override shopifyFetch with mockShopifyFetch
// This can be conditionally applied based on an environment variable, e.g., process.env.USE_MOCKS
export const shopifyFetch = process.env.USE_MOCKS === 'true' ? mockShopifyFetch : originalShopifyFetch;
