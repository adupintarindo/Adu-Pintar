export type ApiSuccessResponse<T = unknown> = { data: T }
export type ApiErrorResponse = { error: string; issues?: Array<{ field: string; message: string }> }
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse
