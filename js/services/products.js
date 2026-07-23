/**
 * products.js
 * ----------------------------------------------------------------------------
 * In-memory catalog cache built on top of api.getProducts(). Provides
 * filtering, sorting, and search helpers used across Home, Collections,
 * Search, and Product Detail pages.
 * ----------------------------------------------------------------------------
 */

import { api } from './api.js';

let _cache = null;
let _categories = null;

async function loadCatalog() {
  if (_cache) return _cache;
  _cache = await api.getProducts();
  return _cache;
}

async function loadCategories() {
  if (_categories) return _categories;
  const res = await fetch('/data/categories.json');
  const json = await res.json();
  _categories = json.categories;
  return _categories;
}

export const products = {
  async all() {
    return loadCatalog();
  },

  async categories() {
    return loadCategories();
  },

  async getBySlug(slug) {
    const list = await loadCatalog();
    return list.find((p) => p.slug === slug) || null;
  },

  async getById(id) {
    const list = await loadCatalog();
    return list.find((p) => p.id === id) || null;
  },

  async featured(limit = 8) {
    const list = await loadCatalog();
    return list.filter((p) => p.featured).slice(0, limit);
  },

  async byTag(tag, limit = 8) {
    const list = await loadCatalog();
    return list.filter((p) => p.tags?.includes(tag)).slice(0, limit);
  },

  async byCategory(categoryId) {
    const list = await loadCatalog();
    return list.filter((p) => p.category === categoryId);
  },

  async related(product, limit = 4) {
    const list = await loadCatalog();
    return list
      .filter((p) => p.id !== product.id && p.category === product.category)
      .slice(0, limit);
  },

  /** Full-text-ish search across name, fabric, tags and description. */
  async search(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const list = await loadCatalog();
    return list.filter((p) => {
      const haystack = [p.name, p.fabric, p.description, ...(p.tags || [])].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  },

  /** Apply collections-page filters: category, price range, fabric. */
  filter(list, { categories = [], minPrice, maxPrice, fabrics = [] } = {}) {
    return list.filter((p) => {
      const finalPrice = products.finalPrice(p);
      if (categories.length && !categories.includes(p.category)) return false;
      if (fabrics.length && !fabrics.includes(p.fabric)) return false;
      if (typeof minPrice === 'number' && finalPrice < minPrice) return false;
      if (typeof maxPrice === 'number' && finalPrice > maxPrice) return false;
      return true;
    });
  },

  sort(list, mode) {
    const arr = [...list];
    switch (mode) {
      case 'price-asc': return arr.sort((a, b) => products.finalPrice(a) - products.finalPrice(b));
      case 'price-desc': return arr.sort((a, b) => products.finalPrice(b) - products.finalPrice(a));
      case 'rating': return arr.sort((a, b) => b.rating - a.rating);
      case 'newest': return arr.reverse();
      default: return arr;
    }
  },

  finalPrice(product) {
    const discount = product.discount || 0;
    return Math.round(product.price * (1 - discount / 100));
  },
};
