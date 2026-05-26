import apiClient from './api.js';

export const searchTrips = async (from, to, date) => {
  try {
    const response = await apiClient.get('/trips', {
      params: {
        from,
        to,
        date
      }
    });
    return response.data || [];
  } catch (error) {
    throw error;
  }
};

export default {
  searchTrips
};
