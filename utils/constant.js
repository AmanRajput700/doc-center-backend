const ERROR_MESSAGE = {
  BAD_REQUEST: 'Bad request',

  TENANT_ALREADY_EXISTS: 'A tenant with the provided details already exists.',
  TENANT_NOT_FOUND: 'Tenant not found.',
  INVALID_SLUG: 'Tenant already exists with same slug.',
  INVALID_ORGNAME: 'Tenant already exists with same orgName.',
  INVALID_OTP: 'The provided otp is invalid.',
  INVALID_API_KEY: 'Invalid API Key',

  USER_NOT_FOUND: 'User not found.',
  USER_ALREADY_EXISTS: 'A user with the provided email already exists.',
  INVALID_USER: 'The specified user is invalid.',
  USER_NOT_ALLOWED: 'You are not allowed to access this resource.',

  INVALID_CREDENTIALS: 'Invalid email or password.',
  PASSWORD_MISMATCH: 'New password and confirm password do not match.',
  OLD_PASSWORD_MISMATCH: 'New password cannot be the same as the old password.',
  TOO_MANY_OTP_ATTEMPTS: 'Too many incorrect OTP attempts. Please resend Otp',
  OTP_RESEND_LIMIT: "Cooldown period for otp resend",

  EMAIL_INVALID: 'The provided email address is invalid.',
  EMAIL_SEND_FAILED: 'Sending Email Failed',

  INVITE_ALREADY_SENT: 'Invite has been already sent on this email',

  DOC_NOT_FOUND: 'Document not found',
  FOLDER_NOT_FOUND: 'Folder Not found',


  ROLE_ALREADY_EXISTS: 'Role Already exists',
  ROLE_NOT_FOUND: 'Role Not Found',

  PERMISSION_NOT_FOUND: 'Permission ID not found',


  SLUG_NOT_FOUND: 'Slug Not Found',
  EMAIL_ALREAY_EXISTS: 'Email Already Exists',


  API_KEY_NOT_FOUND: 'API Key not found',
  API_KEY_MISSING: 'API key missing',


  STORAGE_NOT_FOUND: 'Storage not found',
  STORAGE_EXCEED: 'Storage limit exceed',
  USER_LIMIT_EXCEED: 'User limit exceed',

  OTP_EXPIRED: "OTP expired"
};

const STATUS_CODE = Object.freeze({

  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,

});

const STORAGE_LIMIT = {
  WARNING: 80,
  CRITICAL: 90,
  FULL: 100
};

module.exports = {
  STATUS_CODE,
  ERROR_MESSAGE,
  STORAGE_LIMIT
}