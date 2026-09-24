import type { Category } from "../../types";
import { productStatusLabel } from "../../lib/labels";

/** Display label for a stored product status, in the interface language. */
export const getProductStatus = (status: string) => productStatusLabel(status);

// Product categories are seeded server-side (see server/scripts/seedCategories.js)
// and fetched live via CategoriesDropdown / GET /api/categories, not hardcoded here.
export const categories: Category[] = [];

export const units = [
    "pcs",
    "kg",
    "lbs",
    "liters",
    "gallons",
    "meters",
    "feet",
    "boxes",
    "packs",
];

const configuredServerUrl = import.meta.env.VITE_API_URL?.trim();

if (!configuredServerUrl) {
    throw new Error("VITE_API_URL is required");
}

// All API consumers use one normalized build-time URL. The configured value
// includes /api because Express mounts every application route beneath it.
export const serverUrl = configuredServerUrl.replace(/\/+$/, "");
