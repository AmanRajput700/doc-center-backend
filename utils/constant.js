const ERROR_MESSAGE = {
  BAD_REQUEST: 'Bad request',

  TENANT_ALREADY_EXISTS: 'A tenant with the provided details already exists.',
  TENANT_NOT_FOUND: 'Tenant not found.',
  INVALID_SLUG: 'The provided slug is invalid.',
  INVALID_ORGNAME: 'The provided organization name is invalid.',
  INVALID_OTP: 'The provided otp is invalid.',

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

  INVITE_ALREADY_SENT: 'Invite has been already sent on this email',

  DOC_NOT_FOUND: 'Document not found',


  ROLE_ALREADY_EXISTS: 'Role Already exists',
  ROLE_NOT_FOUND: 'Role Not Found',

  PERMISSION_NOT_FOUND: 'Permission ID not found'
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
  GATEWAY_TIMEOUT: 504

});

module.exports = {
  STATUS_CODE, ERROR_MESSAGE
}