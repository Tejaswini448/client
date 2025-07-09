import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_REACT_APP_API_URL || 'http://13.234.17.49:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ProductItem {
  reviewsCount: any;
  inStock(inStock: any): boolean;
  description: string;
  sizes: never[];
  colors: never[];
  images: any;
  id: string;
  name: string;
  originalPrice: string;
  salePrice: string | number | { $numberDecimal: string };
  discountPercentage: string;
  mainImageUrl: string;
  rating: number;
  saleType: string;
  category: string;
}

const normalizeSalePrice = (
  salePrice: ProductItem['salePrice']
): number | string =>
  typeof salePrice === 'object' && '$numberDecimal' in salePrice
    ? parseFloat(salePrice.$numberDecimal)
    : salePrice;

export const searchProducts = async (query: string): Promise<ProductItem[]> => {
  if (!query.trim()) return [];
  try {
    const response = await api.get<ProductItem[]>('/products/search', {
      params: { query },
    });
    return response.data.map((item) => ({
      ...item,
      salePrice: normalizeSalePrice(item.salePrice),
    }));
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};

export const fetchProducts = async (): Promise<ProductItem[]> => {
  try {
    const response = await api.get<ProductItem[]>('/products');
    return response.data.map((item) => ({
      ...item,
      salePrice: normalizeSalePrice(item.salePrice),
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

export const getProduct = async (id: string): Promise<ProductItem | null> => {
  try {
    if (!id) throw new Error('Product ID is required');
    const response = await api.get<ProductItem>(`/products/${id}`);
    return {
      ...response.data,
      salePrice: normalizeSalePrice(response.data.salePrice),
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
};
export const getCurrentUser = async () => {
  const token = localStorage.getItem('authToken');
  const response = await axios.get(`${API_BASE_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const logoutUser = async () => {
  // If you have an API endpoint to invalidate the token/session on server:
  await axios.post(
    `${API_BASE_URL}/auth/logout`,
    {},
    { withCredentials: true }
  );

  // Clear token/localStorage if you store tokens client-side:
  localStorage.removeItem('token'); // or whatever key you use

  // Optionally clear other user-related info in localStorage/sessionStorage
};
// Correct function signature
export const loginUser = async (credentials: {
  email: string;
  password: string;
}) => {
  const response = await api.post('/auth/login', credentials);
  return response.data; // should return { token, user }
};

export const getWishlistItems = async (
  userId: string
): Promise<{ wishlist: ProductItem[] }> => {
  try {
    // const API_BASE_URL = process.env.API_BASE_URL || 'http://your-api-base-url'; // Make sure this is set
    const response = await fetch(`${API_BASE_URL}/users/${userId}/wishlist`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        Accept: 'application/json', // Explicitly ask for JSON
      },
    });
    console.log(response);

    if (!response.ok) {
      // Try to get error details if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch wishlist');
      } else {
        const text = await response.text();
        throw new Error(text || 'Failed to fetch wishlist');
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    throw new Error('Failed to fetch wishlist. Please try again later.');
  }
};

export const addToWishlist = async (
  userId: string,
  productId: string
): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/wishlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify({ productId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to add to wishlist');
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    throw error;
  }
};

export const removeFromWishlist = async (
  userId: string,
  productId: string
): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/wishlist`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify({ productId }), // Pass productId in body
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to remove from wishlist');
    }

    return await response.json();
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    throw error;
  }
};

export const fetchAllProducts = fetchProducts;
export const fetchFlashSales = fetchProducts;
export const fetchBestSelling = fetchProducts;
export const fetchExploreProducts = fetchProducts;
export const getRelatedProducts = fetchProducts;
