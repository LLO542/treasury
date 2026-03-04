const CACHE_PREFIX = "treasury_cache_";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const cache = {
  set: (key, data) => {
    try {
      const item = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
    } catch (e) {
      console.warn("Cache write failed:", e);
    }
  },

  get: (key) => {
    try {
      const item = localStorage.getItem(CACHE_PREFIX + key);
      if (!item) return null;

      const { data, timestamp } = JSON.parse(item);
      
      // Check if cache is expired
      if (Date.now() - timestamp > CACHE_EXPIRY) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }

      return data;
    } catch (e) {
      console.warn("Cache read failed:", e);
      return null;
    }
  },

  remove: (key) => {
    localStorage.removeItem(CACHE_PREFIX + key);
  },

  clear: () => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(CACHE_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  },
};

// Fetch with cache fallback for offline support
export async function fetchWithCache(cacheKey, fetchFn) {
  try {
    const data = await fetchFn();
    cache.set(cacheKey, data);
    return { data, fromCache: false };
  } catch (error) {
    // On network error, try to return cached data
    if (!navigator.onLine || error.message === "Network Error") {
      const cached = cache.get(cacheKey);
      if (cached) {
        return { data: cached, fromCache: true };
      }
    }
    throw error;
  }
}
