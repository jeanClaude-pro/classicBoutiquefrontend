import * as React from "react";
import type { AuthState, User } from "../types/auth";

export type AuthContextValue = AuthState & {
  /** Records the session the server just opened (POST /auth/login). */
  setAuth: (v: { user: User; expiresAt: string }) => void;
  clearAuth: () => void;
  /** Asks the server to confirm the session (start-up, reconnection). */
  verifySession: () => Promise<"verified" | "refused" | "unreachable">;
};

export const AuthContext = React.createContext<AuthContextValue | undefined>(
  undefined
);
