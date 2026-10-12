// Turn Better Auth client errors into copy that says what failed and what to do.
type AuthError = { status?: number; code?: string; message?: string } | null | undefined;

const BY_CODE: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Wrong email or password. Check both and try again.",
  USER_ALREADY_EXISTS: "There's already an account with this email. Sign in instead.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "There's already an account with this email. Sign in instead.",
  INVALID_PASSWORD: "That password isn't right. Check it and try again.",
  INVALID_TOKEN: "This reset link has expired or was already used. Ask for a new one.",
  SESSION_EXPIRED: "For your safety, sign in again before doing this.",
};

export function authErrorMessage(error: AuthError, fallback = "Couldn't reach Moozer. Check your connection and try again.") {
  if (!error) return fallback;
  if (error.code && BY_CODE[error.code]) return BY_CODE[error.code];
  if (error.status === 429) return "Too many attempts. Wait a minute and try again.";
  if (error.status === 400 && error.message) return error.message;
  return fallback;
}

// Errors Better Auth appends to the error callback URL after Google/GitHub sign-in.
export function oauthErrorMessage(code: string) {
  if (code === "account_not_linked") {
    return "This email already has a Moozer password. Sign in with your email and password instead.";
  }
  return "Google or GitHub sign-in didn't finish. Try again, or use your email and password.";
}
