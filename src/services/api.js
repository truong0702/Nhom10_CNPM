// src/services/api.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('vexere_token');
  }

  /**
   * Set authorization token
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('vexere_token', token);
    } else {
      localStorage.removeItem('vexere_token');
    }
  }

  /**
   * Get authorization header
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Make API request
   */
  async request(endpoint, options = {}) {
    const { params, headers: customHeaders, ...fetchOptions } = options;
    let url = `${this.baseURL}${endpoint}`;

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });

      const queryString = searchParams.toString();
      if (queryString) {
        url += url.includes('?') ? `&${queryString}` : `?${queryString}`;
      }
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...this.getHeaders(),
          ...customHeaders,
        },
      });

      // Try to parse JSON safely (some endpoints may return empty body)
      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        data = null;
      }

      if (!response.ok) {
        const message =
          (data && (data.error || data.message)) ||
          (response.status === 409 ? 'Email da ton tai hoac da duoc su dung' : '') ||
          (response.status === 400 ? 'Du lieu gui len khong hop le' : '') ||
          (response.status === 403 ? 'Ban khong co quyen thuc hien thao tac nay' : '') ||
          'API request failed';
        const error = new Error(message);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      // Network errors (failed to fetch) often come as TypeError
      if (error instanceof TypeError || error.message === 'Failed to fetch') {
        const netErr = new Error('Không thể kết nối tới server. Vui lòng kiểm tra kết nối hoặc khởi động backend.');
        netErr.isNetworkError = true;
        console.error('API Network Error:', error);
        throw netErr;
      }

      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  post(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * PUT request
   */
  put(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  patch(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request
   */
  delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;
