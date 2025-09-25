import process from "process";

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
};

export const VALIDATION_RULES = {
  PHONE_REGEX: /^\+966[0-9]{9}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  MAX_LOGIN_ATTEMPTS: process.env.NODE_ENV === 'production' ? 5: 100000000000,
  LOCKOUT_TIME: process.env.NODE_ENV === 'production' ? 30 * 60 * 1000 : 0, // 30 minutes
};
