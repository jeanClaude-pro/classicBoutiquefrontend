/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { currentLocale } from "../../i18n";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth";
import { serverUrl } from "../../utils/constants";
import { apiErrorFromResponse, requestJson, userError } from "../../lib/apiError";
import { notifyError } from "../../lib/notify";
import { deleteUserCopy, roleChangeCopy, shareholderCategoryCopy, toggleUserStatusCopy } from "../../lib/confirmationCopy";
import { ROLE_LABELS as SHARED_ROLE_LABELS, roleLabel } from "../../config/roles";
import { useConfirmAction } from "../../hooks/useConfirmAction";
import { MODULES, PERMISSION_MODULE_IDS } from "../../config/modules";
import {
  Users,
  Shield,
  Trash2,
  Edit3,
  Check,
  X,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
  Lock,
  ChevronDown,
  Store,
  BookOpen,
  Save,
  Pencil,
} from "lucide-react";

const API_BASE = serverUrl;

type AppRole =
  | "superadmin"
  | "admin"
  | "manager"
  | "inventory_manager"
  | "cashier_supervisor"
  | "staff";

interface AppUser {
  _id: string;
  username: string;
  email: string;
  role: AppRole;
  assignedCategory?: "CLOTHES" | "SHOES";
  isActive: boolean;
  permissions: string[];
  actionPermissions: string[];
  createdAt: string;
}

interface ShopSettings {
  shopName: string;
  shopAddress: string;
  shopNumber: string;
  shopRegistration: string;
  receiptFooter: string;
}

// Same names as the navigation (config/modules.ts). Only real, routed pages.
const ALL_PAGES = PERMISSION_MODULE_IDS.map((id) => ({ path: MODULES[id].path, labelKey: MODULES[id].labelKey }));

// Action keys are stored in user permissions; names come from admin.actions.<key>.
const ALL_ACTIONS = [
  { key: "edit_receipts" },
  { key: "reprint_receipts" },
];

// Same role names as the sidebar and the mobile menu (config/roles.ts).
const ROLE_LABELS = SHARED_ROLE_LABELS as Record<AppRole, string>;

const ROLE_COLORS: Record<AppRole, string> = {
  superadmin: "bg-slate-900 text-white border-slate-700",
  admin: "bg-amber-100 text-amber-800 border-amber-200",
  manager: "bg-purple-100 text-purple-800 border-purple-200",
  inventory_manager: "bg-blue-100 text-blue-800 border-blue-200",
  cashier_supervisor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  staff: "bg-gray-100 text-gray-700 border-gray-200",
};

const ROLE_DEFAULT_PAGES: Record<AppRole, string[]> = {
  superadmin: ALL_PAGES.map((p) => p.path),
  admin: ["/sales", "/reports", "/products"],
  manager: [
    "/",
    "/entry",
    "/sortie",
    "/products",
    "/sales",
    "/entryhistory",
    "/sortiehistory",
    "/customers",
  ],
  inventory_manager: [
    "/",
    "/entry",
    "/sortie",
    "/products",
    "/sales",
    "/entryhistory",
    "/sortiehistory",
  ],
  cashier_supervisor: [
    "/",
    "/entry",
    "/sortie",
    "/sales",
    "/entryhistory",
    "/sortiehistory",
    "/customers",
  ],
  staff: ["/"],
};

// Canonical description of what each role can do in the app
// (keys of admin.capabilities.* in the dictionaries).
const ROLE_CAPABILITIES: Record<AppRole, { pages: string[]; actions: string[] }> = {
  superadmin: {
    pages: ["allPages", "adminConfig"],
    actions: ["fullControl", "manageRoles"],
  },
  admin: {
    pages: ["shareholderScope"],
    actions: ["readOnly"],
  },
  manager: {
    pages: ["pos", "cashFlows", "inventory", "salesHistory", "customers"],
    actions: ["createSales", "recordCash", "manageStock", "viewSales", "editReceiptsIfGranted"],
  },
  inventory_manager: {
    pages: ["pos", "cashFlows", "inventory", "salesHistory"],
    actions: ["createSales", "recordCash", "manageStock", "viewSales"],
  },
  cashier_supervisor: {
    pages: ["pos", "cashFlows", "salesHistory", "customers"],
    actions: ["createSales", "recordCash", "viewSales", "manageCustomers", "editReceiptsIfGranted"],
  },
  staff: {
    pages: ["pos"],
    actions: ["salesOnly", "printReceipt"],
  },
};

const AVATAR_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-600",
  "from-green-500 to-teal-600",
  "from-orange-500 to-red-600",
  "from-teal-500 to-cyan-600",
];

function avatarColor(username: string) {
  return AVATAR_COLORS[username.charCodeAt(0) % AVATAR_COLORS.length];
}

type Tab = "users" | "permissions" | "receipt" | "roles";

export default function AdminPanel() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Inline role editing
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // Inline username editing
  const [editingUsernameId, setEditingUsernameId] = useState<string | null>(null);
  const [editingUsernameValue, setEditingUsernameValue] = useState("");

  // Permissions tab
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUserPerms, setSelectedUserPerms] = useState<string[]>([]);
  const [useCustomPerms, setUseCustomPerms] = useState(false);
  const [selectedUserActions, setSelectedUserActions] = useState<string[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);

  // Receipt settings
  const [shopSettings, setShopSettings] = useState<ShopSettings>({
    shopName: "",
    shopAddress: "",
    shopNumber: "",
    shopRegistration: "",
    receiptFooter: "",
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);

  const { token, user: currentUser } = useAuth();
  const confirmAction = useConfirmAction();
  // The signed-in account cannot deactivate, demote or delete itself.
  const isSelf = (user: AppUser) => user._id === currentUser?.id;

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token || localStorage.getItem("token") || ""}`,
  });

  // ─── Data fetching ───────────────────────────────────────────────────────────

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users`, { headers: authHeaders() });
      if (!res.ok) throw userError(t("admin.loadUsersFailed"));
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      notifyError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchShopSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch(`${API_BASE}/settings/receipt`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw userError(t("admin.loadSettingsFailed"));
      const data = await res.json();
      setShopSettings({
        shopName: data.shopName || "",
        shopAddress: data.shopAddress || "",
        shopNumber: data.shopNumber || "",
        shopRegistration: data.shopRegistration || "",
        receiptFooter: data.receiptFooter || "",
      });
    } catch (err: any) {
      notifyError(err);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchShopSettings();
  }, []);

  // ─── Username editing ────────────────────────────────────────────────────────

  const startEditUsername = (user: AppUser) => {
    setEditingUsernameId(user._id);
    setEditingUsernameValue(user.username);
  };

  const cancelEditUsername = () => {
    setEditingUsernameId(null);
    setEditingUsernameValue("");
  };

  const saveUsername = async (userId: string) => {
    if (!editingUsernameValue.trim()) {
      toast.error(t("admin.usernameEmpty"));
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/username`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ username: editingUsernameValue.trim() }),
      });
      if (!res.ok) {
        throw await apiErrorFromResponse(res);
      }
      const updated = await res.json();
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, username: updated.username } : u
        )
      );
      cancelEditUsername();
      toast.success(t("admin.usernameUpdated"));
    } catch (err: any) {
      notifyError(err);
    }
  };

  // ─── Status / role / delete ──────────────────────────────────────────────────

  const handleToggleStatus = (user: AppUser) => {
    confirmAction.request<{ user?: { isActive?: boolean } }>({
      ...toggleUserStatusCopy(user),
      action: () => requestJson(`${API_BASE}/users/${user._id}/status`, { method: "PUT" }),
      onSuccess: (data) => {
        const isActive = typeof data?.user?.isActive === "boolean" ? data.user.isActive : !user.isActive;
        setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, isActive } : u)));
      },
    });
  };

  const handleDeleteUser = (user: AppUser) => {
    confirmAction.request({
      ...deleteUserCopy(user),
      action: () => requestJson(`${API_BASE}/users/${user._id}`, { method: "DELETE" }),
      onSuccess: () => setUsers((prev) => prev.filter((u) => u._id !== user._id)),
    });
  };

  const requestRoleChange = (user: AppUser, role: AppRole, assignedCategory?: "CLOTHES" | "SHOES") => {
    // Close the inline editor: cancelling leaves the current role displayed.
    setEditingRoleId(null);
    const category = role === "admin" ? assignedCategory || "CLOTHES" : undefined;
    if (role === user.role && (role !== "admin" || category === (user.assignedCategory || "CLOTHES"))) return;
    const copy = user.role === "admin" && role === "admin"
      ? shareholderCategoryCopy(user, category || "CLOTHES")
      : roleChangeCopy(user, { role, assignedCategory: category }, roleLabel);
    confirmAction.request<Partial<AppUser>>({
      ...copy,
      action: () => requestJson(`${API_BASE}/users/${user._id}/role`, {
        method: "PUT",
        body: { role, ...(category ? { assignedCategory: category } : {}) },
      }),
      onSuccess: (updated) => {
        setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, ...(updated || {}), role } : u)));
      },
      onError: async (error) => { if (error.isConflict || error.status === 404) await fetchUsers(); },
    });
  };

  // ─── Permissions ─────────────────────────────────────────────────────────────

  const handleSelectUserForPerms = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find((u) => u._id === userId);
    if (user) {
      const hasCustom = user.role === "admin" || Boolean(user.permissions && user.permissions.length > 0);
      setUseCustomPerms(hasCustom);
      setSelectedUserPerms(
        hasCustom ? (user.permissions || []) : [...ROLE_DEFAULT_PAGES[user.role]]
      );
      setSelectedUserActions(user.actionPermissions || []);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUserId) return;
    setSavingPerms(true);
    try {
      const permsToSave = useCustomPerms ? selectedUserPerms : [];
      const [permRes, actionRes] = await Promise.all([
        fetch(`${API_BASE}/users/${selectedUserId}/permissions`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({ permissions: permsToSave }),
        }),
        fetch(`${API_BASE}/users/${selectedUserId}/actions`, {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({ actionPermissions: selectedUserActions }),
        }),
      ]);
      if (!permRes.ok) throw await apiErrorFromResponse(permRes);
      if (!actionRes.ok) throw await apiErrorFromResponse(actionRes);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === selectedUserId
            ? { ...u, permissions: permsToSave, actionPermissions: selectedUserActions }
            : u
        )
      );
      toast.success(t("admin.permissionsUpdated"));
    } catch (err: any) {
      notifyError(err);
    } finally {
      setSavingPerms(false);
    }
  };

  const handleResetPermissions = async (user: AppUser) => {
    setSavingPerms(true);
    try {
      // The success message is shown only when the server accepted the change.
      const res = await fetch(`${API_BASE}/users/${user._id}/permissions`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ permissions: [] }),
      });
      if (!res.ok) throw await apiErrorFromResponse(res);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, permissions: [] } : u))
      );
      setUseCustomPerms(false);
      setSelectedUserPerms([...ROLE_DEFAULT_PAGES[user.role]]);
      toast.success(t("admin.permissionsReset"));
    } catch (err: any) {
      notifyError(err);
    } finally {
      setSavingPerms(false);
    }
  };

  const toggleActionPerm = (key: string) => {
    setSelectedUserActions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // ─── Receipt settings ─────────────────────────────────────────────────────────

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch(`${API_BASE}/settings/receipt`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(shopSettings),
      });
      if (!res.ok) {
        throw await apiErrorFromResponse(res);
      }
      toast.success(t("admin.settingsUpdated"));
    } catch (err: any) {
      notifyError(err);
    } finally {
      setSavingSettings(false);
    }
  };

  // ─── Derived values ───────────────────────────────────────────────────────────

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const activeCount = users.filter((u) => u.isActive).length;
  const selectedUser = users.find((u) => u._id === selectedUserId);

  const TABS = [
    { key: "users" as Tab, label: t("admin.tabs.users"), icon: Users },
    { key: "permissions" as Tab, label: t("admin.tabs.permissions"), icon: Lock },
    { key: "receipt" as Tab, label: t("admin.tabs.receipt"), icon: Store },
    { key: "roles" as Tab, label: t("admin.tabs.roles"), icon: BookOpen },
  ] as const;

  return (
    <div className="flex-1 p-6 overflow-auto bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">

        {/* ─── Header ─── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{MODULES.admin.label}</h1>
              <p className="text-sm text-gray-500">
                {MODULES.admin.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              <p className="text-sm text-gray-500 mt-0.5">{t("admin.totalAccounts")}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
              <p className="text-sm text-gray-500 mt-0.5">{t("admin.active")}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <p className="text-2xl font-bold text-red-500">
                {users.length - activeCount}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">{t("admin.deactivated")}</p>
            </div>
          </div>
        </div>

        {/* ─── Tabs ─── */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-200 shadow-sm flex-wrap">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════ USERS TAB ══════════════ */}
        {tab === "users" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("admin.searchPlaceholder")}
                  aria-label={t("admin.searchLabel")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                {t("common.refresh")}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("admin.columns.user")}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("admin.columns.role")}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("admin.columns.status")}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("admin.columns.permissions")}</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("admin.columns.createdAt")}</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-gray-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-40" />
                        {t("common.loading")}
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-gray-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        {t("admin.noUsers")}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user._id}
                        className={`hover:bg-gray-50 transition-colors ${!user.isActive ? "opacity-50" : ""}`}
                      >
                        {/* User info + inline username edit */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColor(user.username)} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}
                            >
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              {editingUsernameId === user._id ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    value={editingUsernameValue}
                                    onChange={(e) =>
                                      setEditingUsernameValue(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveUsername(user._id);
                                      if (e.key === "Escape") cancelEditUsername();
                                    }}
                                    autoFocus
                                    className="text-sm border border-blue-300 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 w-36"
                                  />
                                  <button
                                    onClick={() => saveUsername(user._id)}
                                    className="text-emerald-600 hover:text-emerald-800"
                                    aria-label={t("admin.saveUsername")}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={cancelEditUsername}
                                    className="text-gray-400 hover:text-gray-600"
                                    aria-label={t("admin.cancelEdit")}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <p className="font-medium text-gray-900 text-sm truncate">
                                    {user.username}
                                  </p>
                                  <button
                                    onClick={() => startEditUsername(user)}
                                    className="text-gray-300 hover:text-blue-500 transition-colors flex-shrink-0"
                                    title={t("admin.editUsername")}
                                    aria-label={t("admin.editUsername")}
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role (inline editable) */}
                        <td className="px-5 py-3.5">
                          {editingRoleId === user._id ? (
                            <div className="flex items-center gap-2">
                              <select
                                defaultValue={user.role === "admin" ? `admin:${user.assignedCategory || "CLOTHES"}` : user.role}
                                onChange={(e) => {
                                  const [nextRole, category] = e.target.value.split(":");
                                  requestRoleChange(
                                    user,
                                    nextRole as AppRole,
                                    category as "CLOTHES" | "SHOES" | undefined
                                  );
                                }}
                                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 bg-white"
                                autoFocus
                                aria-label={t("admin.changeRole")}
                              >
                                {(Object.keys(ROLE_LABELS) as AppRole[]).filter((r) => r !== "admin").map((r) => (
                                  <option key={r} value={r}>
                                    {ROLE_LABELS[r]}
                                  </option>
                                ))}
                                <option value="admin:CLOTHES">{ROLE_LABELS.admin} · {t("accounting.categoryTitles.CLOTHES")}</option>
                                <option value="admin:SHOES">{ROLE_LABELS.admin} · {t("accounting.categoryTitles.SHOES")}</option>
                              </select>
                              <button
                                onClick={() => setEditingRoleId(null)}
                                className="text-gray-400 hover:text-gray-600"
                                aria-label={t("admin.cancelRoleEdit")}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-start gap-1.5">
                              <button
                                onClick={() => setEditingRoleId(user._id)}
                                disabled={isSelf(user)}
                                title={isSelf(user) ? t("admin.ownRole") : undefined}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS[user.role]} hover:opacity-80 transition-opacity`}
                              >
                                {ROLE_LABELS[user.role]}
                                <Edit3 className="w-3 h-3 opacity-60" />
                              </button>
                              {user.role === "admin" && (
                                <select
                                  value={user.assignedCategory || "CLOTHES"}
                                  onChange={(event) => requestRoleChange(user, "admin", event.target.value as "CLOTHES" | "SHOES")}
                                  disabled={confirmAction.busy}
                                  className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-900"
                                  aria-label={t("admin.categoryOf", { name: user.username })}
                                >
                                  <option value="CLOTHES">{t("accounting.categoryTitles.CLOTHES")}</option>
                                  <option value="SHOES">{t("accounting.categoryTitles.SHOES")}</option>
                                </select>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          {isSelf(user) ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">{t("admin.activeSelf")}</span>
                          ) : <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={confirmAction.busy}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              user.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                            }`}
                          >
                            {user.isActive ? (
                              <><ToggleRight className="w-3.5 h-3.5" />{t("admin.statusActive")}</>
                            ) : (
                              <><ToggleLeft className="w-3.5 h-3.5" />{t("admin.statusDeactivated")}</>
                            )}
                          </button>}
                        </td>

                        {/* Permissions badge */}
                        <td className="px-5 py-3.5">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full border w-fit ${
                                user.permissions && user.permissions.length > 0
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-gray-50 text-gray-500 border-gray-200"
                              }`}
                            >
                              {user.permissions && user.permissions.length > 0
                                ? t("admin.pagesCount", { count: user.permissions.length })
                                : t("admin.byRole")}
                            </span>
                            {user.actionPermissions && user.actionPermissions.length > 0 && (
                              <span className="text-xs px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200 w-fit">
                                {t("admin.actionsCount", { count: user.actionPermissions.length })}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Created at */}
                        <td className="px-5 py-3.5 text-xs text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString(currentLocale())}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                handleSelectUserForPerms(user._id);
                                setTab("permissions");
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title={t("admin.managePermissions")}
                              aria-label={t("admin.managePermissions")}
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                            {!isSelf(user) && <button
                              onClick={() => handleDeleteUser(user)}
                              disabled={confirmAction.busy}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title={t("admin.deleteUser")}
                              aria-label={t("admin.deleteNamed", { name: user.username })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════ PERMISSIONS TAB ══════════════ */}
        {tab === "permissions" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{t("admin.permissionsTitle")}</h2>
                  <p className="text-sm text-gray-500">{t("admin.permissionsHint")}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* User selector */}
              <div className="mb-6">
                <label htmlFor="admin-utilisateur" className="block text-sm font-medium text-gray-700 mb-2">
                  {t("admin.selectUser")}
                </label>
                <div className="relative max-w-sm">
                  <select
                    id="admin-utilisateur"
                    value={selectedUserId}
                    onChange={(e) => handleSelectUserForPerms(e.target.value)}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white appearance-none"
                  >
                    <option value="">{t("admin.chooseUser")}</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.username} ({ROLE_LABELS[u.role]})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {!selectedUserId && (
                <div className="text-center py-16 text-gray-400">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{t("admin.selectUserHint")}</p>
                </div>
              )}

              {selectedUserId && selectedUser && (
                <div>
                  {/* Selected user card */}
                  <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColor(selectedUser.username)} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
                      {selectedUser.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{selectedUser.username}</p>
                      <p className="text-xs text-gray-500">{selectedUser.email}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${ROLE_COLORS[selectedUser.role]}`}>
                      {ROLE_LABELS[selectedUser.role]}
                    </span>
                  </div>

                  {/* ── Section 1: Page permissions ── */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-500" />
                      {t("admin.pageAccess")}
                    </h3>

                    {/* Custom perms toggle */}
                    <div className="flex items-center justify-between mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-amber-800">{t("admin.customPermissions")}</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          {useCustomPerms
                            ? t("admin.customOn")
                            : t("admin.customOff")}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const next = !useCustomPerms;
                          setUseCustomPerms(next);
                          if (next && selectedUserPerms.length === 0) {
                            setSelectedUserPerms([...ROLE_DEFAULT_PAGES[selectedUser.role]]);
                          }
                        }}
                        role="switch"
                        aria-checked={useCustomPerms}
                        aria-label={t("admin.customPermissions")}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${useCustomPerms ? "bg-amber-500" : "bg-gray-300"}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${useCustomPerms ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {(selectedUser.role === "admin"
                        ? ALL_PAGES.filter((page) => ["/sales", "/reports", "/products"].includes(page.path))
                        : ALL_PAGES
                      ).map((page) => {
                        const checkedByRole = ROLE_DEFAULT_PAGES[selectedUser.role].includes(page.path);
                        const checkedCustom = selectedUserPerms.includes(page.path);
                        const isChecked = useCustomPerms ? checkedCustom : checkedByRole;

                        return (
                          <label
                            key={page.path}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${
                              isChecked
                                ? useCustomPerms
                                  ? "border-blue-300 bg-blue-50"
                                  : "border-emerald-200 bg-emerald-50"
                                : "border-gray-200 bg-white hover:bg-gray-50"
                            } ${!useCustomPerms ? "cursor-default" : ""}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={!useCustomPerms}
                              onChange={(e) => {
                                if (!useCustomPerms) return;
                                setSelectedUserPerms((prev) =>
                                  e.target.checked
                                    ? [...prev, page.path]
                                    : prev.filter((p) => p !== page.path)
                                );
                              }}
                              className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 flex-shrink-0"
                            />
                            <span className={`text-sm ${isChecked ? "text-gray-800 font-medium" : "text-gray-500"}`}>
                              {t(page.labelKey)}
                            </span>
                            {!useCustomPerms && checkedByRole && (
                              <span className="ml-auto text-xs text-emerald-600 font-medium">{t("admin.roleBadge")}</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Section 2: Action permissions ── */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-500" />
                      {t("admin.actionPermissions")}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      {t("admin.actionPermissionsHint")}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(selectedUser.role === "admin" ? [] : ALL_ACTIONS).map((action) => {
                        const isGranted = selectedUserActions.includes(action.key);
                        return (
                          <label
                            key={action.key}
                            className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all select-none ${
                              isGranted
                                ? "border-purple-300 bg-purple-50"
                                : "border-gray-200 bg-white hover:bg-gray-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isGranted}
                              onChange={() => toggleActionPerm(action.key)}
                              className="w-4 h-4 mt-0.5 rounded text-purple-600 border-gray-300 focus:ring-purple-500 flex-shrink-0"
                            />
                            <div>
                              <p className={`text-sm font-medium ${isGranted ? "text-purple-800" : "text-gray-700"}`}>
                                {t(`admin.actions.${action.key}.label`)}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">{t(`admin.actions.${action.key}.description`)}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={handleSavePermissions}
                      disabled={savingPerms}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {savingPerms ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" />{t("admin.saving")}</>
                      ) : (
                        <><Check className="w-4 h-4" />{t("admin.save")}</>
                      )}
                    </button>

                    {useCustomPerms && (
                      <button
                        onClick={() => handleResetPermissions(selectedUser)}
                        disabled={savingPerms}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
                      >
                        <X className="w-4 h-4" />
                        {t("admin.resetToRole")}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ RECEIPT SETTINGS TAB ══════════════ */}
        {tab === "receipt" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Store className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{t("admin.receiptTitle")}</h2>
                    <p className="text-sm text-gray-500">
                      {t("admin.receiptHint")}
                    </p>
                  </div>
                </div>
              </div>

              {loadingSettings ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2 opacity-40" />
                  {t("common.loading")}
                </div>
              ) : (
                <form onSubmit={handleSaveSettings} className="p-6 space-y-5">
                  <div>
                    <label htmlFor="admin-nom-etablissement" className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t("admin.shopName")}
                    </label>
                    <input
                      id="admin-nom-etablissement"
                      type="text"
                      value={shopSettings.shopName}
                      onChange={(e) =>
                        setShopSettings((s) => ({ ...s, shopName: e.target.value }))
                      }
                      placeholder="ETS DOUBLE M CLASSIC BOUTIQUE"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="admin-adresse" className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t("admin.address")}
                    </label>
                    <input
                      id="admin-adresse"
                      type="text"
                      value={shopSettings.shopAddress}
                      onChange={(e) =>
                        setShopSettings((s) => ({ ...s, shopAddress: e.target.value }))
                      }
                      placeholder="780 AV. Du 30 Juin Coin Tabora, Q/MAKUTANO, C/Lubumbashi"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="admin-numero-de-telephone" className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t("admin.phoneNumbers")}
                    </label>
                    <input
                      id="admin-numero-de-telephone"
                      type="text"
                      value={shopSettings.shopNumber}
                      onChange={(e) =>
                        setShopSettings((s) => ({ ...s, shopNumber: e.target.value }))
                      }
                      placeholder="+243 975 085 799"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="admin-numero-d-enregistrement" className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t("admin.registration")}
                    </label>
                    <input
                      id="admin-numero-d-enregistrement"
                      type="text"
                      value={shopSettings.shopRegistration}
                      onChange={(e) =>
                        setShopSettings((s) => ({ ...s, shopRegistration: e.target.value }))
                      }
                      placeholder="LSH/RCCM/22-A-01266"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="admin-pied-de-page" className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t("admin.footer")}
                    </label>
                    <textarea
                      id="admin-pied-de-page"
                      value={shopSettings.receiptFooter}
                      onChange={(e) =>
                        setShopSettings((s) => ({ ...s, receiptFooter: e.target.value }))
                      }
                      placeholder={t("admin.footerPlaceholder")}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {t("admin.footerHint")}
                    </p>
                  </div>

                  {/* Live preview */}
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      {t("admin.preview")}
                    </p>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center font-mono text-xs leading-relaxed">
                      <p className="font-bold text-base">{shopSettings.shopName || "ETS DOUBLE M CLASSIC BOUTIQUE"}</p>
                      {shopSettings.shopAddress && (
                        <p className="text-gray-600">{shopSettings.shopAddress}</p>
                      )}
                      {shopSettings.shopNumber && (
                        <p className="text-gray-600">{t("receipt.tel")}: {shopSettings.shopNumber}</p>
                      )}
                      {shopSettings.shopRegistration && (
                        <p className="text-gray-500 text-[10px]">{shopSettings.shopRegistration}</p>
                      )}
                      <div className="border-t border-dashed border-gray-300 my-2" />
                      <p className="text-gray-400 italic text-[10px]">
                        {shopSettings.receiptFooter || t("admin.footer")}
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingSettings ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" />{t("admin.saving")}</>
                    ) : (
                      <><Save className="w-4 h-4" />{t("admin.saveSettings")}</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ ROLES & RIGHTS TAB ══════════════ */}
        {tab === "roles" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-2">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{t("admin.rolesTitle")}</h2>
                  <p className="text-sm text-gray-500">
                    {t("admin.rolesHint")}
                  </p>
                </div>
              </div>
            </div>

            {(Object.keys(ROLE_LABELS) as AppRole[]).map((role) => {
              const cap = ROLE_CAPABILITIES[role];
              return (
                <div key={role} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className={`px-5 py-3 border-b border-gray-100 flex items-center gap-3`}>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${ROLE_COLORS[role]}`}>
                      {ROLE_LABELS[role]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {t("admin.pageCount", { count: cap.pages.length })} • {t("admin.actionsCount", { count: cap.actions.length })}
                    </span>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {t("admin.accessiblePages")}
                      </p>
                      <ul className="space-y-1.5">
                        {cap.pages.map((p, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                            {t(`admin.capabilities.${p}`)}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        {t("admin.allowedActions")}
                      </p>
                      <ul className="space-y-1.5">
                        {cap.actions.map((a, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                            {t(`admin.capabilities.${a}`)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {/* Pages grid preview */}
                  <div className="px-5 pb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("admin.routes")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ROLE_DEFAULT_PAGES[role].map((path) => {
                        const page = ALL_PAGES.find((p) => p.path === path);
                        return page ? (
                          <span key={path} className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs border border-gray-200">
                            {t(page.labelKey)}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Security note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
              <p className="text-sm font-semibold text-yellow-800 mb-1">{t("admin.securityNote")}</p>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                <li>{t("admin.security.hashed")}</li>
                <li>{t("admin.security.jwt")}</li>
                <li>{t("admin.security.deactivated")}</li>
                <li>{t("admin.security.protected")}</li>
                <li>{t("admin.security.signup", { role: roleLabel("staff") })}</li>
              </ul>
            </div>

            {/* Action permissions reference */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-500" />
                {t("admin.availableActions")}
              </p>
              <div className="space-y-3">
                {ALL_ACTIONS.map((action) => (
                  <div key={action.key} className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                    <span className="text-xs font-mono bg-purple-100 text-purple-700 px-2 py-0.5 rounded flex-shrink-0 mt-0.5">
                      {action.key}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{t(`admin.actions.${action.key}.label`)}</p>
                      <p className="text-xs text-gray-500">{t(`admin.actions.${action.key}.description`)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Current user info footer */}
        {currentUser && (
          <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
            <Shield className="w-3 h-3" />
            {t("admin.signedInAs")}{" "}
            <span className="font-semibold text-gray-600">{currentUser.username}</span>
            <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${ROLE_COLORS[currentUser.role as AppRole]}`}>
              {ROLE_LABELS[currentUser.role as AppRole]}
            </span>
          </div>
        )}
      </div>
      {confirmAction.dialog}
    </div>
  );
}
