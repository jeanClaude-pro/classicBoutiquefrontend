import * as React from "react";
import type { AuthState, User } from "../types/auth";

export type AuthContextValue = AuthState & {
  /** Stores the session returned by a successful server login. */
  setAuth: (v: { token: string | null; user: User | null }) => void;
  clearAuth: () => void;
  /** Asks the server to confirm the stored session (start-up, reconnection). */
  verifySession: () => Promise<"verified" | "refused" | "unreachable">;
};

export const AuthContext = React.createContext<AuthContextValue | undefined>(
  undefined
);
