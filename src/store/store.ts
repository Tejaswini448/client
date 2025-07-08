import {
  configureStore,
  createSlice,
  PayloadAction,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import wishlistReducer from '@/slices/wishlistSlice';

/* ------------------- Cart Slice ------------------- */
interface CartItem {
  _id: string;
  name: string;
  mainImageUrl: string;
  price: number;
  quantity: number;
  subtotal: number;
}

const initialCartState: CartItem[] = JSON.parse(
  localStorage.getItem('cart') || '[]'
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: initialCartState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const item = state.find((i) => i._id === action.payload._id);
      if (item) {
        item.quantity += 1;
        item.subtotal = item.quantity * item.price;
      } else {
        state.push({ ...action.payload });
      }
      localStorage.setItem('cart', JSON.stringify(state));
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      const updated = state.filter((item) => item._id !== action.payload);
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    },
    incrementCart: (state, action: PayloadAction<CartItem>) => {
      const item = state.find((i) => i._id === action.payload._id);
      if (item) {
        item.quantity += 1;
        item.subtotal = item.price * item.quantity;
      }
      localStorage.setItem('cart', JSON.stringify(state));
    },
    decrementFromCart: (state, action: PayloadAction<CartItem>) => {
      const item = state.find((i) => i._id === action.payload._id);
      if (item && item.quantity > 1) {
        item.quantity -= 1;
        item.subtotal = item.price * item.quantity;
      }
      localStorage.setItem('cart', JSON.stringify(state));
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ _id: string; quantity: number }>
    ) => {
      const item = state.find((i) => i._id === action.payload._id);
      if (item) {
        item.quantity = action.payload.quantity;
        item.subtotal = item.price * item.quantity;
      }
      localStorage.setItem('cart', JSON.stringify(state));
    },
    clearCart: () => {
      localStorage.removeItem('cart');
      return [];
    },
  },
});

/* ------------------- Order Slice ------------------- */
interface OrderItem {
  userId: string;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

const loadOrders = (): OrderItem[] => {
  try {
    const data = localStorage.getItem('myOrders');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveOrders = (orders: OrderItem[]) => {
  try {
    localStorage.setItem('myOrders', JSON.stringify(orders));
  } catch (error) {
    console.error('Order save failed:', error);
  }
};

const orderSlice = createSlice({
  name: 'orders',
  initialState: loadOrders(),
  reducers: {
    addOrder: (state, action: PayloadAction<OrderItem>) => {
      const updated = [...state, action.payload];
      saveOrders(updated);
      return updated;
    },
    clearOrders: () => {
      localStorage.removeItem('myOrders');
      return [];
    },
  },
});

/* ------------------- Auth Slice ------------------- */
interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
  address?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

const getUserFromStorage = (): User | null => {
  try {
    const userStr = localStorage.getItem('authUser');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Failed to parse authUser from localStorage:', error);
    return null;
  }
};

const getTokenFromStorage = (): string | null => {
  try {
    return localStorage.getItem('authToken');
  } catch {
    return null;
  }
};

const initialAuthState: AuthState = {
  user: getUserFromStorage(),
  token: getTokenFromStorage(),
  loading: true,
};

// ✅ FIXED validateToken to use /auth/validate-token
export const validateToken = createAsyncThunk(
  'auth/validateToken',
  async (_, { dispatch }) => {
    const token = getTokenFromStorage();
    if (!token) {
      dispatch(setAuthLoading(false));
      return null;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/validate-token`, // ✅ Corrected path
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Token invalid');
      }

      const user = await response.json();
      dispatch(loginSuccess({ user, token }));
      return user;
    } catch (error) {
      console.error('Token validation failed:', error);
      dispatch(logout());
      return null;
    } finally {
      dispatch(setAuthLoading(false));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    loginSuccess: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      localStorage.setItem('authUser', JSON.stringify(action.payload.user));
      localStorage.setItem('authToken', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.loading = false;
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

/* ------------------- Exports ------------------- */
export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  decrementFromCart,
  incrementCart,
} = cartSlice.actions;

export const { addOrder, clearOrders } = orderSlice.actions;

export const { loginSuccess, logout, setAuthLoading } = authSlice.actions;

/* ------------------- Store ------------------- */
export const store = configureStore({
  reducer: {
    cart: cartSlice.reducer,
    orders: orderSlice.reducer,
    auth: authSlice.reducer,
    wishlist: wishlistReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/* ------------------- Hooks ------------------- */
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
