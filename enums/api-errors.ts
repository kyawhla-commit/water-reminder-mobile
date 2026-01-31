export enum ApiErrors {
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export const getErrorMessage = (error: ApiErrors): string => {
  switch (error) {
    case ApiErrors.NETWORK_ERROR:
      return 'Network error. Please check your connection.';
    case ApiErrors.UNAUTHORIZED:
      return 'Unauthorized. Please log in again.';
    case ApiErrors.NOT_FOUND:
      return 'Resource not found.';
    case ApiErrors.SERVER_ERROR:
      return 'Server error. Please try again later.';
    case ApiErrors.VALIDATION_ERROR:
      return 'Invalid data provided.';
    default:
      return 'An unknown error occurred.';
  }
};
