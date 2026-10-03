"use client";

import { formatDateGMT2, formatDateTimeGMT2 } from "../../utils/dateUtils";
import { useState, useEffect, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { serverUrl } from "../../utils/constants";
import { formatUSD } from "../../utils/salePricing";
import { requestJson, toApiError } from "../../lib/apiError";
import { notifyError, notifySuccess } from "../../lib/notify";
import { MODULES } from "../../config/modules";
import { StatusBadge } from "../../components/ui";
import { COMPACT_LAYOUT_QUERY, useMediaQuery } from "../../hooks/useMediaQuery";
import {
  Users,
  Search,
  Eye,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ShoppingBag,
  RefreshCw,
  AlertCircle,
  Shield,
  UserPlus,
} from "lucide-react";

interface Customer {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  totalPurchases: number;
  totalSpent: number;
  firstPurchaseDate: string;
  lastPurchaseDate: string;
  createdAt: string;
  updatedAt: string;
  isFamilyMember?: boolean;
}

export default function Customers() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [recalculating, setRecalculating] = useState<string | null>(null);
  const [updatingFamily, setUpdatingFamily] = useState<string | null>(null);
  const [familyOnly, setFamilyOnly] = useState(false);
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [familyForm, setFamilyForm] = useState({ name: "", phone: "", email: "" });
  const [creatingFamily, setCreatingFamily] = useState(false);
  const [familyFormError, setFamilyFormError] = useState<string | null>(null);
  const isPhone = useMediaQuery(COMPACT_LAYOUT_QUERY);

  useEffect(() => {
    fetchCustomers();
  }, []);

  // The API pages at most 100 customers; fetch every page with the session token.
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const all: Customer[] = [];
      for (let page = 1, totalPages = 1; page <= totalPages && page <= 50; page += 1) {
        const data = await requestJson<{ customers?: Customer[]; totalPages?: number }>(`${serverUrl}/customers?limit=100&page=${page}`);
        all.push(...(data?.customers ?? []));
        totalPages = data?.totalPages ?? 1;
      }
      setCustomers(all);
    } catch (error) {
      const apiError = toApiError(error);
      setLoadError(apiError.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshCustomers = async () => {
    setRefreshing(true);
    await fetchCustomers();
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      (!familyOnly || customer.isFamilyMember === true) &&
      ((customer.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone || "").includes(searchTerm) ||
      (customer.email || "").toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const familyCount = customers.filter((customer) => customer.isFamilyMember === true).length;

  const calculateTotalRevenue = () => {
    return customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "null" || dateString === "undefined") return t("common.notAvailable");
    return formatDateGMT2(dateString) || t("common.notAvailable");
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString || dateString === "null" || dateString === "undefined") return t("common.notAvailable");
    return formatDateTimeGMT2(dateString) || t("common.notAvailable");
  };

  const recalculateCustomerStats = async (customerId: string) => {
    try {
      setRecalculating(customerId);
      await requestJson(`${serverUrl}/customers/${customerId}/recalculate`, { method: "POST" });
      await fetchCustomers();
      notifySuccess(t("customers.recalculated"));
    } catch (error) {
      notifyError(error);
    } finally {
      setRecalculating(null);
    }
  };

  const viewCustomerDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  // Registers a new client directly as a family member (superadmin only, the
  // server refuses anyone else). An existing client is marked from the table
  // instead, so no duplicate record is created for the same phone.
  const createFamilyMember = async (event: FormEvent) => {
    event.preventDefault();
    const name = familyForm.name.trim();
    if (!name) { setFamilyFormError(t("familyMember.nameRequired")); return; }
    const phone = familyForm.phone.trim();
    const existing = phone ? customers.find((customer) => customer.phone === phone) : undefined;
    if (existing) {
      setFamilyFormError(t("familyMember.phoneExists", { name: existing.name }));
      return;
    }
    try {
      setCreatingFamily(true);
      setFamilyFormError(null);
      const created = await requestJson<Customer>(`${serverUrl}/customers`, {
        method: "POST",
        body: { name, phone, email: familyForm.email.trim(), isFamilyMember: true },
      });
      setCustomers((current) => [created, ...current]);
      setFamilyForm({ name: "", phone: "", email: "" });
      setShowFamilyForm(false);
      notifySuccess(t("familyMember.created", { name: created.name }));
    } catch (error) {
      setFamilyFormError(toApiError(error).message);
    } finally {
      setCreatingFamily(false);
    }
  };

  const toggleFamilyStatus = async (customer: Customer) => {
    try {
      setUpdatingFamily(customer._id);
      const updated = await requestJson<Customer>(`${serverUrl}/customers/${customer._id}`, {
        method: "PUT",
        body: { isFamilyMember: !customer.isFamilyMember },
      });
      setCustomers((current) => current.map((item) => item._id === updated._id ? updated : item));
      setSelectedCustomer((current) => current?._id === updated._id ? updated : current);
      notifySuccess(updated.isFamilyMember ? t("familyMember.marked") : t("familyMember.removed"));
    } catch (error) {
      notifyError(error);
    } finally {
      setUpdatingFamily(null);
    }
  };

  // Row actions, shared by the desktop table and the phone cards.
  const customerActions = (customer: Customer) => (
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => viewCustomerDetails(customer)}
          className="text-blue-600 hover:text-blue-900 p-1 rounded"
          title={t("customers.viewDetails")}
          aria-label={t("customers.viewDetails")}
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => void toggleFamilyStatus(customer)}
          disabled={updatingFamily === customer._id}
          className="min-h-9 rounded-lg border border-gray-300 bg-white px-2.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          aria-label={customer.isFamilyMember ? t("familyMember.removeNamed", { name: customer.name }) : t("familyMember.markNamed", { name: customer.name })}
        >
          {customer.isFamilyMember ? t("familyMember.remove") : t("familyMember.mark")}
        </button>
        <button
          onClick={() => recalculateCustomerStats(customer._id)}
          disabled={recalculating === customer._id}
          className="text-green-600 hover:text-green-900 p-1 rounded disabled:opacity-50"
          title={t("customers.recalculate")}
          aria-label={t("customers.recalculate")}
        >
          <RefreshCw
            className={`w-4 h-4 ${
              recalculating === customer._id ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>
  );

  // Admin-only: block non-admin users after all hooks and functions are defined
  const isAdmin = (() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw).role === "superadmin" : false;
    } catch { return false; }
  })();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t("customers.accessDenied")}</h2>
          <p className="text-gray-500 text-sm">
            {t("customers.adminOnly")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{MODULES.customers.label}</h1>
          <p className="text-gray-600">{MODULES.customers.description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => { setShowFamilyForm((value) => !value); setFamilyFormError(null); }}
            aria-expanded={showFamilyForm}
            aria-controls="family-member-form"
            className="ui-button ui-button--secondary"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            {t("familyMember.add")}
          </button>
          <button
            onClick={refreshCustomers}
            disabled={refreshing}
            className="ui-button ui-button--secondary"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? t("common.refreshing") : t("common.refresh")}
          </button>
        </div>
      </div>

      {showFamilyForm && (
        <form id="family-member-form" onSubmit={createFamilyMember} className="rounded-lg border border-gray-200 bg-white p-4" noValidate>
          <h2 className="font-semibold text-gray-900">{t("familyMember.formTitle")}</h2>
          <p className="mt-1 text-sm text-gray-600">{t("familyMember.formHint")}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <label className="text-sm font-medium text-gray-700">
              {t("familyMember.name")}
              <input required value={familyForm.name} onChange={(event) => setFamilyForm((form) => ({ ...form, name: event.target.value }))} maxLength={120} className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3" autoComplete="off" />
            </label>
            <label className="text-sm font-medium text-gray-700">
              {t("familyMember.phone")}
              <input type="tel" value={familyForm.phone} onChange={(event) => setFamilyForm((form) => ({ ...form, phone: event.target.value }))} className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3" autoComplete="off" />
            </label>
            <label className="text-sm font-medium text-gray-700">
              {t("familyMember.email")}
              <input type="email" value={familyForm.email} onChange={(event) => setFamilyForm((form) => ({ ...form, email: event.target.value }))} className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3" autoComplete="off" />
            </label>
          </div>
          {familyFormError && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-white p-3 text-sm text-red-800">{familyFormError}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="submit" disabled={creatingFamily} className="ui-button ui-button--primary">
              {creatingFamily ? t("familyMember.creating") : t("familyMember.create")}
            </button>
            <button type="button" onClick={() => setShowFamilyForm(false)} className="min-h-11 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50">
              {t("common.cancel")}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t("customers.searchPlaceholder")}
              aria-label={t("customers.searchLabel")}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={familyOnly} onChange={(event) => setFamilyOnly(event.target.checked)} className="h-4 w-4" />
            {t("familyMember.filter", { count: familyCount })}
          </label>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">{t("customers.totalCustomers")}</p>
              <p className="text-xl font-semibold text-gray-900">{customers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">{t("customers.totalPurchases")}</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatUSD(calculateTotalRevenue())}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t("customers.activeCustomers", { count: customers.filter((c) => c.totalSpent > 0).length })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {customers.some(
        (customer) =>
          customer.totalPurchases > 0 &&
          (customer.totalSpent === 0 || customer.totalSpent > 100000)
      ) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                {t("customers.warningTitle")}
              </p>
              <p className="text-sm text-yellow-700">
                {t("customers.warningText")}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t("customers.directory", { count: filteredCustomers.length })}
          </h2>
          <button
            onClick={refreshCustomers}
            disabled={refreshing}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {t("common.refresh")}
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">{t("customers.loading")}</p>
            </div>
          ) : loadError ? (
            <div className="m-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
              <div>
                <p className="font-semibold">{t("customers.loadFailed")}</p>
                <p className="mt-1">{loadError}</p>
                <button type="button" onClick={refreshCustomers} className="mt-3 rounded-lg bg-red-600 px-3 py-2 font-semibold text-white hover:bg-red-700">{t("common.retry")}</button>
              </div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t("customers.noneFound")}</p>
            </div>
          ) : isPhone ? (
            <ul className="divide-y divide-gray-200" aria-label={t("customers.directory", { count: filteredCustomers.length })}>
              {filteredCustomers.map((customer) => (
                <li key={customer._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-gray-900">{customer.name}</p>
                      {customer.isFamilyMember && <div className="mt-1"><StatusBadge tone="primary">{t("familyMember.label")}</StatusBadge></div>}
                      <p className="mt-1 flex items-center gap-1 text-sm text-gray-600"><Phone className="h-3 w-3" aria-hidden="true" />{customer.phone || "—"}</p>
                      {customer.email && <p className="flex items-center gap-1 break-all text-sm text-gray-500"><Mail className="h-3 w-3" aria-hidden="true" />{customer.email}</p>}
                    </div>
                    <p className="flex-none text-right text-sm font-semibold tabular-nums text-gray-900">{formatUSD(customer.totalSpent)}</p>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div><dt className="text-xs text-gray-500">{t("customers.columns.purchases")}</dt><dd className="tabular-nums text-gray-900">{customer.totalPurchases}</dd></div>
                    <div><dt className="text-xs text-gray-500">{t("customers.columns.lastPurchase")}</dt><dd className="text-gray-900">{formatDate(customer.lastPurchaseDate)}</dd></div>
                  </dl>
                  <div className="mt-3">{customerActions(customer)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("customers.columns.customer")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("customers.columns.contact")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("customers.columns.purchases")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("customers.columns.totalSpent")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("customers.columns.lastPurchase")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-soft border border-green-200 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {(customer.name || "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.name}
                          </div>
                          {customer.isFamilyMember && <div className="mt-1"><StatusBadge tone="primary">{t("familyMember.label")}</StatusBadge></div>}
                          <div className="text-sm text-gray-500">
                            {t("customers.since", { date: formatDate(customer.createdAt) })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {customer.phone || "—"}
                      </div>
                      {customer.email && (
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {customer.totalPurchases}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatUSD(customer.totalSpent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(customer.lastPurchaseDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {customerActions(customer)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* REMOVED PAGINATION SECTION - No more page navigation */}
      </div>

      {showModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{t("customers.details")}</h3>
              <button
                onClick={() => setShowModal(false)}
                aria-label={t("common.close")}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xl font-medium text-blue-600">
                    {(selectedCustomer.name || "?").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">{selectedCustomer.name}</h4>
                  {selectedCustomer.isFamilyMember && <div className="mt-1"><StatusBadge tone="primary">{t("familyMember.label")}</StatusBadge></div>}
                  <p className="text-gray-600">
                    {t("customers.since", { date: formatDate(selectedCustomer.createdAt) })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-1">{t("customers.phoneNumber")}</span>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{selectedCustomer.phone || "—"}</span>
                  </div>
                </div>
                {selectedCustomer.email && (
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-1">{t("common.email")}</span>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{selectedCustomer.email}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600">{t("customers.purchaseCount")}</p>
                      <p className="text-xl font-semibold text-blue-900">{selectedCustomer.totalPurchases}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600">{t("customers.amountSpent")}</p>
                      <p className="text-xl font-semibold text-green-900">
                        {formatUSD(selectedCustomer.totalSpent)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-purple-600">{t("customers.firstPurchase")}</p>
                      <p className="text-sm font-semibold text-purple-900">
                        {formatDateTime(selectedCustomer.firstPurchaseDate)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-orange-600">{t("customers.columns.lastPurchase")}</p>
                      <p className="text-sm font-semibold text-orange-900">
                        {formatDateTime(selectedCustomer.lastPurchaseDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => recalculateCustomerStats(selectedCustomer._id)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t("customers.recalculateButton")}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
