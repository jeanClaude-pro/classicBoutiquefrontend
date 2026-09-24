"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Package, Plus, Search, Edit, Trash2, Eye, X, Calculator } from "lucide-react";
import { productStatusLabel } from "../../lib/labels";
import type { Product } from "../../types";
import { units, serverUrl } from "../../utils/constants";
import CategoriesDropdown from "../../components/CategoriesDropdown";
import { requestJson } from "../../lib/apiError";
import { notifyError, notifySuccess } from "../../lib/notify";
import { deleteProductCopy } from "../../lib/confirmationCopy";
import { useConfirmAction } from "../../hooks/useConfirmAction";
import { MODULES } from "../../config/modules";
import { createPriceSnapshot, formatFC, formatUSD } from "../../utils/salePricing";

interface ExchangeRateInfo {
  rate: number;
  effectiveFrom: string;
  lastUpdated: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin" | "staff";
}

export default function Products() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    description: "",
    price: 0,
    category: "",
    mainCategory: "CLOTHES",
    subcategory: "",
    purchasedQuantity: 1,
    unitCost: 0,
    brand: "",
    stock: 0,
    minStock: 0,
    unit: "pcs",
    weight: 0,
    status: "active",
  });

  // FC is the default entry currency for price/cost fields. USD stays the
  // canonical value stored in formData.price / formData.unitCost.
  const [currencyMode, setCurrencyMode] = useState<"usd" | "fc">("fc");
  const [priceFCInput, setPriceFCInput] = useState<string>("");
  const [unitCostFCInput, setUnitCostFCInput] = useState<string>("");
  const [exchangeRate, setExchangeRate] = useState<ExchangeRateInfo | null>(null);
  const [loadingRate, setLoadingRate] = useState(true);

  // Load the current exchange rate, the same way NewSale.tsx does.
  useEffect(() => {
    const loadExchangeRate = async () => {
      try {
        setLoadingRate(true);
        const response = await fetch(`${serverUrl}/exchange-rates/current`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setExchangeRate(data);
        }
      } catch (error) {
        console.error("Error loading exchange rate:", error);
      } finally {
        setLoadingRate(false);
      }
    };
    loadExchangeRate();
  }, []);

  const toggleCurrencyMode = () => {
    setCurrencyMode((prev) => (prev === "usd" ? "fc" : "usd"));
  };

  // Price must be > 0 (createPriceSnapshot enforces this). unitCost may be 0.
  const handlePriceUsdChange = (value: string) => {
    const usd = Number.parseFloat(value) || 0;
    setFormData((prev) => ({ ...prev, price: usd }));
    setPriceFCInput(
      usd > 0 && exchangeRate ? Math.round(usd * exchangeRate.rate).toString() : ""
    );
  };

  const handlePriceFcChange = (value: string) => {
    setPriceFCInput(value);
    const fc = Number.parseFloat(value) || 0;
    if (fc > 0 && exchangeRate) {
      try {
        const snapshot = createPriceSnapshot(fc, "FC", exchangeRate.rate);
        setFormData((prev) => ({ ...prev, price: snapshot.priceUSD }));
      } catch {
        // ignore invalid intermediate input
      }
    } else {
      setFormData((prev) => ({ ...prev, price: 0 }));
    }
  };

  const handleUnitCostUsdChange = (value: string) => {
    const usd = Number.parseFloat(value) || 0;
    setFormData((prev) => ({ ...prev, unitCost: usd }));
    setUnitCostFCInput(
      exchangeRate ? Math.round(usd * exchangeRate.rate).toString() : ""
    );
  };

  const handleUnitCostFcChange = (value: string) => {
    setUnitCostFCInput(value);
    const fc = Number.parseFloat(value) || 0;
    if (fc > 0 && exchangeRate) {
      try {
        const snapshot = createPriceSnapshot(fc, "FC", exchangeRate.rate);
        setFormData((prev) => ({ ...prev, unitCost: snapshot.priceUSD }));
      } catch {
        // ignore invalid intermediate input
      }
    } else {
      // unitCost may legitimately be 0 (e.g. donated stock).
      setFormData((prev) => ({ ...prev, unitCost: 0 }));
    }
  };

  // Get current user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const isAdmin = currentUser?.role === "superadmin";
  const confirmAction = useConfirmAction();
  // One submission at a time: a double click must not create two articles.
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  // API Functions
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${serverUrl}/products`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        console.error("Failed to fetch products:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      category: "",
      mainCategory: "CLOTHES",
      subcategory: "",
      purchasedQuantity: 1,
      unitCost: 0,
      brand: "",
      stock: 0,
      minStock: 0,
      unit: "pcs",
      weight: 0,
      status: "active",
    });
    setCurrencyMode("fc");
    setPriceFCInput("");
    setUnitCostFCInput("");
  };

  // Build the priceEnteredAmount/enteredCurrency/exchangeRate (and unitCost
  // equivalent) fields the server expects, from whichever currency is
  // currently primary in the form.
  const buildSubmitPayload = (): Partial<Product> => {
    const rate = exchangeRate?.rate;
    const priceEnteredAmount =
      currencyMode === "fc" ? Number.parseFloat(priceFCInput) || 0 : formData.price || 0;
    const unitCostEnteredAmount =
      currencyMode === "fc" ? Number.parseFloat(unitCostFCInput) || 0 : formData.unitCost || 0;

    return {
      ...formData,
      priceEnteredAmount,
      priceEnteredCurrency: currencyMode === "fc" ? "FC" : "USD",
      priceExchangeRate: rate,
      unitCostEnteredAmount,
      unitCostEnteredCurrency: currencyMode === "fc" ? "FC" : "USD",
      unitCostExchangeRate: rate,
    };
  };

  const saveProduct = async (id: string | null, productData: Partial<Product>) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const saved = await requestJson<Product>(id ? `${serverUrl}/products/${id}` : `${serverUrl}/products`, {
        method: id ? "PUT" : "POST",
        body: productData,
      });
      setProducts((prev) => (id ? prev.map((p) => (p._id === id ? saved : p)) : [...prev, saved]));
      if (id) setShowEditModal(false); else setShowAddModal(false);
      resetForm();
      notifySuccess(id ? t("products.saved") : t("products.added"));
    } catch (error) {
      // The form stays open with the user's input so it can be corrected.
      notifyError(error);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const deleteProduct = (product: Product) => {
    confirmAction.request({
      ...deleteProductCopy(product),
      action: () => requestJson(`${serverUrl}/products/${product._id}`, { method: "DELETE" }),
      onSuccess: () => setProducts((prev) => prev.filter((p) => p._id !== product._id)),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = buildSubmitPayload();
    void saveProduct(showEditModal && selectedProduct ? selectedProduct._id : null, payload);
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData(product);
    setCurrencyMode("fc");
    const rate = exchangeRate?.rate;
    setPriceFCInput(
      product.priceFC !== undefined
        ? product.priceFC.toString()
        : rate
        ? Math.round(product.price * rate).toString()
        : ""
    );
    setUnitCostFCInput(
      product.unitCostFC !== undefined
        ? product.unitCostFC.toString()
        : rate && product.unitCost !== undefined
        ? Math.round(product.unitCost * rate).toString()
        : ""
    );
    setShowEditModal(true);
  };

  const openViewModal = (product: Product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory ||
      product.category === selectedCategory ||
      product.subcategory === selectedCategory ||
      product.mainCategory === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Function to display stock information based on user role
  const renderStockInfo = (product: Product) => {
    if (isAdmin) {
      // Admin sees exact stock numbers
      return (
        <span
          className={`text-sm ${
            product.stock <= product.minStock
              ? "text-red-600 font-medium"
              : "text-gray-900"
          }`}
        >
          {product.stock} {product.unit}
        </span>
      );
    } else {
      // Staff sees stock status instead of exact numbers
      if (product.stock === 0) {
        return (
          <span className="text-sm text-red-600 font-medium">{t("products.outOfStock")}</span>
        );
      } else if (product.stock <= product.minStock) {
        return (
          <span className="text-sm text-orange-600 font-medium">{t("products.lowStock")}</span>
        );
      } else {
        return (
          <span className="text-sm text-green-600 font-medium">{t("products.inStock")}</span>
        );
      }
    }
  };

  // Function to display stock details in view modal based on user role
  const renderStockDetails = (product: Product) => {
    if (isAdmin) {
      // Admin sees all stock details
      return (
        <>
          <div className="flex justify-between">
            <span className="text-gray-600">{t("products.currentStockLabel")}</span>
            <span
              className={`font-medium ${
                product.stock <= product.minStock
                  ? "text-red-600"
                  : "text-gray-900"
              }`}
            >
              {product.stock} {product.unit}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">{t("products.minStockLabel")}</span>
            <span className="font-medium">
              {product.minStock} {product.unit}
            </span>
          </div>
        </>
      );
    } else {
      // Staff sees only stock status
      return (
        <div className="flex justify-between">
          <span className="text-gray-600">{t("products.stockStatusLabel")}</span>
          {product.stock === 0 ? (
            <span className="font-medium text-red-600">{t("products.outOfStock")}</span>
          ) : product.stock <= product.minStock ? (
            <span className="font-medium text-orange-600">{t("products.lowStock")}</span>
          ) : (
            <span className="font-medium text-green-600">{t("products.inStock")}</span>
          )}
        </div>
      );
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{MODULES.products.label}</h1>
          <p className="text-gray-600">{MODULES.products.description}</p>
          {!isAdmin && (
            <p className="text-sm text-blue-600 mt-1">
              {t("products.staff")}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4 " />
          {t("products.addNew")}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-300">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t("products.searchPlaceholder")}
                aria-label={t("products.searchLabel")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-64">
            <CategoriesDropdown
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-300">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">{t("products.loading")}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">{t("products.noneFound")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("products.columns.item")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("products.columns.category")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("products.columns.stock")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("products.columns.status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product, idx) => (
                  <tr key={product._id ?? idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.brand}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-semibold">{product.mainCategory || t("products.unclassified")}</span>
                      {product.subcategory && <span className="block text-xs text-gray-500">{product.subcategory}</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStockInfo(product)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {productStatusLabel(product.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openViewModal(product)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title={t("products.view")}
                          aria-label={t("products.view")}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => openEditModal(product)}
                              className="text-green-600 hover:text-green-900 p-1 rounded"
                              title={t("products.edit")}
                              aria-label={t("products.edit")}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteProduct(product)}
                              className="text-red-600 hover:text-red-900 p-1 rounded"
                              title={t("products.delete")}
                              aria-label={t("products.deleteNamed", { name: product.name })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal - Only for Admin */}
      {(showAddModal || showEditModal) && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {showEditModal ? t("products.editTitle") : t("products.addTitle")}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label={t("common.close")}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {t("products.basicInfo")}
                  </h3>

                  <div>
                    <label htmlFor="product-nom" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("products.name")}
                    </label>
                    <input
                      id="product-nom"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="product-description" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("products.description")}
                    </label>
                    <textarea
                      id="product-description"
                      rows={3}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="product-categorie-principale" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("products.mainCategory")}
                    </label>
                    <select
                      id="product-categorie-principale"
                      required
                      value={formData.mainCategory || ""}
                      onChange={(e) => setFormData((prev) => ({
                        ...prev,
                        mainCategory: e.target.value as "CLOTHES" | "SHOES",
                        category: prev.subcategory || e.target.value,
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="CLOTHES">CLOTHES — {t("accounting.categoryTitles.CLOTHES")}</option>
                      <option value="SHOES">SHOES — {t("accounting.categoryTitles.SHOES")}</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="product-sous-categorie" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("products.subcategory")}
                    </label>
                    <CategoriesDropdown
                      id="product-sous-categorie"
                      selectedCategory={formData.subcategory || ""}
                      setSelectedCategory={(subcategory) => setFormData((prev) => ({
                        ...prev,
                        subcategory,
                        category: subcategory || prev.mainCategory || "CLOTHES",
                      }))}
                    />
                  </div>

                  <div>
                    <label htmlFor="product-marques" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("products.brands")}
                    </label>
                    <input
                      id="product-marques"
                      type="text"
                      value={formData.brand}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          brand: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="product-statut" className="block text-sm font-medium text-gray-700 mb-1">
                      {t("products.status")}
                    </label>
                    <select
                      id="product-statut"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          status: e.target.value as "active" | "inactive",
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none focus:border-transparent"
                    >
                      <option value="active">{productStatusLabel("active")}</option>
                      <option value="inactive">{productStatusLabel("inactive")}</option>
                    </select>
                  </div>
                </div>

                {/* Pricing & Inventory */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {t("products.pricingStock")}
                  </h3>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="product-prix-de-vente" className="block text-sm font-medium text-gray-700">
                        {t("products.salePrice")}
                      </label>
                      <button
                        type="button"
                        onClick={toggleCurrencyMode}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        <Calculator className="w-3 h-3" />
                        {currencyMode === "usd" ? "USD → FC" : "FC → USD"}
                      </button>
                    </div>
                    {currencyMode === "usd" ? (
                      <input
                        id="product-prix-de-vente"
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        value={formData.price}
                        onChange={(e) => handlePriceUsdChange(e.target.value)}
                        placeholder={t("products.priceUsdPlaceholder")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none focus:border-transparent"
                      />
                    ) : (
                      <input
                        id="product-prix-de-vente"
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={priceFCInput}
                        onChange={(e) => handlePriceFcChange(e.target.value)}
                        placeholder={t("products.priceFcPlaceholder")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none focus:border-transparent"
                      />
                    )}
                    {!loadingRate && exchangeRate && (
                      <p className="mt-1 text-xs text-green-600">
                        ≈ {currencyMode === "usd" ? formatFC((formData.price || 0) * exchangeRate.rate) : formatUSD(formData.price || 0)}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {t("products.priceHint")}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="product-quantite-achetee" className="block text-sm font-medium text-gray-700 mb-1">
                        {t("products.purchasedQuantity")}
                      </label>
                      <input
                        id="product-quantite-achetee"
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={formData.purchasedQuantity}
                        onChange={(e) => setFormData((prev) => ({
                          ...prev,
                          purchasedQuantity: Number.parseInt(e.target.value) || 1,
                          ...(!showEditModal ? { stock: Number.parseInt(e.target.value) || 1 } : {}),
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="product-cout-d-acquisition" className="block text-sm font-medium text-gray-700">
                          {t("products.unitCost")}
                        </label>
                      </div>
                      {currencyMode === "usd" ? (
                        <input
                          id="product-cout-d-acquisition"
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={formData.unitCost}
                          onChange={(e) => handleUnitCostUsdChange(e.target.value)}
                          placeholder={t("products.freePlaceholder")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      ) : (
                        <input
                          id="product-cout-d-acquisition"
                          type="number"
                          min="0"
                          step="1"
                          required
                          value={unitCostFCInput}
                          onChange={(e) => handleUnitCostFcChange(e.target.value)}
                          placeholder={t("products.freePlaceholder")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                      )}
                      {!loadingRate && exchangeRate && (
                        <p className="mt-1 text-xs text-green-600">
                          ≈ {currencyMode === "usd" ? formatFC((formData.unitCost || 0) * exchangeRate.rate) : formatUSD(formData.unitCost || 0)}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="-mt-2 text-xs text-gray-500">
                    {t("products.costHint")}{" "}
                    {exchangeRate
                      ? formatFC((formData.unitCost || 0) * (formData.purchasedQuantity || 1) * exchangeRate.rate)
                      : formatUSD((formData.unitCost || 0) * (formData.purchasedQuantity || 1))}
                    {exchangeRate && (
                      <> (≈ {formatUSD((formData.unitCost || 0) * (formData.purchasedQuantity || 1))})</>
                    )}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="product-stock-actuel" className="block text-sm font-medium text-gray-700 mb-1">
                        {t("products.currentStock")}
                      </label>
                      <input
                        id="product-stock-actuel"
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={formData.stock}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            stock: Number.parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="product-unite" className="block text-sm font-medium text-gray-700 mb-1">
                        {t("products.unit")}
                      </label>
                      <select
                        id="product-unite"
                        value={formData.unit}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            unit: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none focus:border-transparent"
                      >
                        {units.map((unit, idx) => (
                          <option key={idx} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="product-stock-minimum" className="block text-sm font-medium text-gray-700 mb-1">
                        {t("products.minStock")}
                      </label>
                      <input
                        id="product-stock-minimum"
                        type="number"
                        value={formData.minStock}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            minStock: Number.parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? t("products.saving") : showEditModal ? t("products.update") : t("products.add")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      {showViewModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {t("products.detailsTitle")}
                </h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label={t("common.close")}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-start gap-6">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-gray-600 mt-1">{selectedProduct.brand}</p>
                  <p className="text-gray-700 mt-2">
                    {selectedProduct.description}
                  </p>
                  <div className="mt-4 flex items-center gap-4">
                    {typeof selectedProduct.price === "number" && (
                      <span className="text-2xl font-bold text-green-600">
                        {formatFC(
                          selectedProduct.priceFC ??
                            (exchangeRate ? selectedProduct.price * exchangeRate.rate : 0)
                        )}
                        <span className="block text-sm font-normal text-gray-500">
                          ≈ {formatUSD(selectedProduct.price)}
                        </span>
                      </span>
                    )}
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedProduct.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {productStatusLabel(selectedProduct.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">
                    {t("products.itemInfo")}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("products.categoryLabel")}</span>
                      <span className="font-medium">
                        {selectedProduct.mainCategory || t("products.unclassified")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("products.subcategoryLabel")}</span>
                      <span className="font-medium">{selectedProduct.subcategory || "—"}</span>
                    </div>
                    {isAdmin && (
                      <>
                        <div className="flex justify-between"><span className="text-gray-600">{t("products.purchasedQuantityLabel")}</span><span className="font-medium">{selectedProduct.purchasedQuantity ?? "—"}</span></div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t("products.totalCostLabel")}</span>
                          <span className="font-medium text-right">
                            {selectedProduct.totalAcquisitionCost === undefined ? "—" : (
                              <>
                                {formatFC(
                                  selectedProduct.totalAcquisitionCostFC ??
                                    (exchangeRate ? selectedProduct.totalAcquisitionCost * exchangeRate.rate : 0)
                                )}
                                <span className="block text-xs font-normal text-gray-500">≈ {formatUSD(selectedProduct.totalAcquisitionCost)}</span>
                              </>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t("products.unitCostLabel")}</span>
                          <span className="font-medium text-right">
                            {selectedProduct.unitCost === undefined ? "—" : (
                              <>
                                {formatFC(
                                  selectedProduct.unitCostFC ??
                                    (exchangeRate ? selectedProduct.unitCost * exchangeRate.rate : 0)
                                )}
                                <span className="block text-xs font-normal text-gray-500">≈ {formatUSD(selectedProduct.unitCost)}</span>
                              </>
                            )}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("products.unitLabel")}</span>
                      <span className="font-medium">
                        {selectedProduct.unit}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">{t("products.columns.stock")}</h4>
                  <div className="space-y-2 text-sm">
                    {renderStockDetails(selectedProduct)}
                  </div>
                </div>
              </div>

              {selectedProduct.weight > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">
                    {t("products.physical")}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t("products.weightLabel")}</span>
                      <span className="font-medium">
                        {selectedProduct.weight} kg
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {isAdmin && (
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      openEditModal(selectedProduct);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    {t("products.editButton")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {confirmAction.dialog}
    </div>
  );
}
