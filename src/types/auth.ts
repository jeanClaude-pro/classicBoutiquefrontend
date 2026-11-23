export type Role =
  | "superadmin"
  | "admin"
  | "manager"
  | "inventory_manager"
  | "cashier_supervisor"
  | "staff";

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  assignedCategory?: "CLOTHES" | "SHOES";
  isActive?: boolean;
  permissions?: string[];
  actionPermissions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  /** A session exists (confirmed by the server, or `offline` = not yet). The
   *  session itself is an httpOnly cookie that page code never sees. */
  signedIn: boolean;
  /** When the server said the session expires (ISO date). */
  expiresAt: string | null;
  user: User | null;
  offline: boolean;
  loading: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  expiresAt: string;
}
