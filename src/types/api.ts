export interface ApiError {
  status?: number
  message: string
  code?: string
}

export interface ProblemDetail {
  status?: number
  title?: string
  detail?: string
  message?: string
  code?: string
}
