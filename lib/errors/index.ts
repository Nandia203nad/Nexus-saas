export class AppError extends Error {
  constructor(message: string, public statusCode = 500, public code = 'INTERNAL_ERROR') {
    super(message); this.name = 'AppError';
  }
}
export const ErrorMessages = {
  INVALID_CREDENTIALS: 'Имэйл эсвэл нууц үг буруу байна',
  USER_EXISTS: 'Энэ имэйл хаяг бүртгэлтэй байна',
  UNAUTHORIZED: 'Нэвтрэх эрхгүй байна',
  FORBIDDEN: 'Хандах эрхгүй байна',
  TOKEN_EXPIRED: 'Нэвтрэх хугацаа дууссан байна',
  BLOG_NOT_FOUND: 'Блог олдсонгүй',
  BLOG_PREMIUM: 'Энэ нийтлэлийг үзэхийн тулд Premium эрх шаардлагатай',
  USER_NOT_FOUND: 'Хэрэглэгч олдсонгүй',
  SERVER_ERROR: 'Серверийн алдаа гарлаа',
};
export function handleError(error: unknown) {
  if (error instanceof AppError) return { message: error.message, code: error.code, status: error.statusCode };
  const detail = error instanceof Error ? error.message : String(error);
  const message = process.env.NODE_ENV === 'development'
    ? `${ErrorMessages.SERVER_ERROR}: ${detail}`
    : ErrorMessages.SERVER_ERROR;
  return { message, code: 'INTERNAL_ERROR', status: 500 };
}
