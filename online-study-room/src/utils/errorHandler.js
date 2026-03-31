/**
 * Frontend Error Handling Utility
 * Provides consistent error handling and user-friendly error messages
 */

export const handleError = (error) => {
  console.error('Error:', error);

  // Axios/API errors
  if (error.response) {
    const { status, data } = error.response;
    const message = data?.error || data?.message || 'An error occurred';

    switch (status) {
      case 400:
        return `Invalid input: ${message}`;
      case 401:
        return 'Unauthorized. Please log in again.';
      case 403:
        return 'You do not have permission for this action.';
      case 404:
        return 'Resource not found.';
      case 409:
        return `Conflict: ${message}`;
      case 413:
        return 'File is too large. Please upload a smaller file.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return message || 'An error occurred. Please try again.';
    }
  }

  // Network errors
  if (error.message === 'Network Error') {
    return 'Network error. Check your connection.';
  }

  // Timeout
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }

  // Generic error
  return error.message || 'An unexpected error occurred. Please try again.';
};

/**
 * Async wrapper for try-catch with error handling
 */
export const asyncWrapper = async (fn) => {
  try {
    return await fn();
  } catch (error) {
    const message = handleError(error);
    throw new Error(message);
  }
};

/**
 * Create axios error interceptor
 */
export const createErrorInterceptor = (instance) => {
  instance.interceptors.response.use(
    response => response,
    error => {
      // Log error details
      console.error('API Error:', {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });

      // Handle specific cases
      if (error.response?.status === 401) {
        // Token expired - clear storage and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('displayName');
        window.location.href = '/login';
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

/**
 * Validation errors
 */
export const ValidationError = {
  username: 'Username must be 3-30 characters (letters, numbers, hyphens, underscores)',
  password: 'Password must be at least 6 characters',
  displayName: 'Display name must be 2-50 characters',
  roomName: 'Room name must be 3-100 characters',
  email: 'Please enter a valid email',
  file: 'File must be less than 10MB',
  avatar: 'Avatar must be an image file less than 5MB'
};
