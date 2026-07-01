/** Maps Firebase Auth error codes to user-friendly messages. */
export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case "auth/email-already-in-use":
      return "That email is already registered. Try signing in instead.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "Email or password is incorrect.";
    case "auth/wrong-password":
      return "Incorrect password. Try again or reset it below.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 8 characters.";
    case "auth/too-many-requests":
      return "Too many attempts — please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Connection failed. Check your internet connection.";
    case "auth/credential-already-in-use":
      return "This email is already linked to another account.";
    case "auth/operation-not-allowed":
      return "Email sign-in is not enabled. Please contact support.";
    default:
      return (error as Error)?.message ?? "Something went wrong. Please try again.";
  }
}
