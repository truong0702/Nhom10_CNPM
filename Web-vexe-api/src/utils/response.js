export const successResponse = (data, message = 'Success', status = 200) => {
  return {
    status,
    success: true,
    message,
    data,
  };
};

export const errorResponse = (error, status = 400) => {
  return {
    status,
    success: false,
    error: error.message || error,
  };
};

export default { successResponse, errorResponse };
