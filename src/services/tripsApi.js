import apiClient from './api.js';

export const searchTrips = async (from, to, date, filters = {}) => {
  try {
    const response = await apiClient.get('/trips', {
      params: {
        from,
        to,
        date,
        timeOfDay: filters.timeOfDay,
        vehicleType: filters.vehicleType,
      }
    });
    return response.data || [];
  } catch (error) {
    throw error;
  }
};

export const getLocations = async () => {
  try {
    const response = await apiClient.get('/trips/locations');
    // apiClient returns parsed JSON from server: { success: true, data: [...] }
    // so the locations array lives at response.data
    return response?.data || [];
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
};

export default {
  searchTrips,
  getLocations
};
