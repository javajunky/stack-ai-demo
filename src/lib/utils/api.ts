type ApiError = {
  error: string;
  status: number;
};

export const handleApiError = async (response: Response): Promise<ApiError> => {
  const error = await response.text();
  try {
    // Try to parse as JSON first
    const jsonError = JSON.parse(error);
    return {
      error: jsonError.error || jsonError.message || "Unknown error occurred",
      status: response.status,
    };
  } catch {
    // If not JSON, use the raw text
    return {
      error: error || "Unknown error occurred",
      status: response.status,
    };
  }
};

export const createApiResponse = async <T>(
  promise: Promise<Response>
): Promise<T> => {
  const response = await promise;
  if (!response.ok) {
    const error = await handleApiError(response);
    throw new Error(error.error);
  }
  return response.json();
};
