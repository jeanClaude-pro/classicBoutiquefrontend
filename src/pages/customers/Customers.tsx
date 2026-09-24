"use client";

import { formatDateGMT2, formatDateTimeGMT2 } from "../../utils/dateUtils";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { serverUrl } from "../../utils/constants";
import { formatUSD } from "../../utils/salePricing";
import { requestJson, toApiError } from "../../lib/apiError";
import { notifyError, notifySuccess } from "../../lib/notify";
import { MODULES } from "../../config/modules";
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
      (customer.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone || "").includes(searchTerm) ||
      (customer.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8 max-w-md w-full text-center">
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
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{MODULES.customers.label}</h1>
          <p className="text-gray-600">{MODULES.customers.description}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={refreshCustomers}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? t("common.refreshing") : t("common.refresh")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
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
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">{t("customers.totalCustomers")}</p>
              <p className="text-xl font-semibold text-gray-900">{customers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
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

      <div className="bg-white rounded-lg shadow">
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
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {(customer.name || "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.name}
                          </div>
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewCustomerDetails(customer)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title={t("customers.viewDetails")}
                          aria-label={t("customers.viewDetails")}
                        >
                          <Eye className="w-4 h-4" />
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
