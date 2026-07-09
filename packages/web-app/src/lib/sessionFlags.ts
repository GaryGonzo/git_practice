// Set by LoginScreen right before navigating to /app, read once by AppShell
// to show the welcome-back modal, then cleared -- so it fires once per login
// action, not on every page refresh while the session persists.
export const JUST_LOGGED_IN_KEY = "golfable_just_logged_in";
