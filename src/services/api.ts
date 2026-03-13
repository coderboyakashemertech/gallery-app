import { API_BASE_URL } from '../config/api';
import type { ApiErrorResponse, ApiSuccessResponse } from '../types/auth';

type RequestOptions = {
  body?: unknown;
  method?: 'GET' | 'POST';
  token?: string | null;
};

export class ApiRequestError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
  }
}

export async function apiRequest<T>(
  path: string,
  { body, method = 'GET', token }: RequestOptions = {},
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const json = (await response.json()) as
    | ApiSuccessResponse<T>
    | ApiErrorResponse;

  if (!response.ok || !json.success) {
    const message =
      'message' in json ? json.message : 'Request failed. Please try again.';
    const statusCode =
      'error' in json ? json.error.statusCode : response.status || 500;
    throw new ApiRequestError(message, statusCode);
  }

  return json;
}
