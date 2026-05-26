import { createContext, useContext, useState, useEffect } from 'react';
import authApi from '../services/authApi.js';
import adminApi from '../services/adminApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize user from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('vexere_token');
        if (token) {
          // Try to fetch user profile from backend
          const response = await authApi.getProfile();
          setUser(response?.data || response?.user || response || null);
        }
      } catch (err) {
        console.error('Auth initialization failed:', err);
        // Clear token if profile fetch fails
        localStorage.removeItem('vexere_token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const register = async (email, password, fullName, phone = '') => {
    try {
      setError(null);
      setLoading(true);

      const response = await authApi.register(email, password, fullName, phone);
      setUser(response?.user || response?.data || response || null);

      return response;
    } catch (err) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await authApi.login(email, password);
      setUser(response?.user || response?.data || response || null);

      return response;
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    try {
      authApi.logout();
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const isAdmin = () => user?.role === 'admin';

  const adminGetAllUsers = async () => {
    const response = await adminApi.getUsers();
    return response.users || [];
  };

  const adminUpdateUser = async (id, payload) => {
    const response = await adminApi.updateUser(id, payload);
    return response.user;
  };

  const adminDeleteUser = async (id) => {
    const response = await adminApi.deleteUser(id);
    return response;
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    isAdmin,
    adminGetAllUsers,
    adminUpdateUser,
    adminDeleteUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    // In some dev/test situations the context may be missing (HMR/multi React instances).
    // Return a safe fallback to avoid app crash and surface a console warning.
    console.warn('useAuth: AuthContext missing, returning fallback stub.');
    return {
      user: null,
      loading: true,
      error: null,
      register: async () => { throw new Error('Auth not available') },
      login: async () => { throw new Error('Auth not available') },
      logout: () => {},
      isAdmin: () => false,
      adminGetAllUsers: async () => [],
      adminUpdateUser: async () => null,
      adminDeleteUser: async () => null,
      isAuthenticated: false,
    };
  }

  return context;
}

export default AuthContext;
