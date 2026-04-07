// API Service with Caching, Retry, and Error Handling
class APIService {
  constructor() {
    this.cache = new Map();
    this.requestQueue = new Map();
    this.rateLimits = new Map();
  }

  // Generic GET request with caching
  async get(url, options = {}) {
    const {
      cache = true,
      cacheTTL = 600000, // 10 minutes
      timeout = 10000,
      retry = 3,
      retryDelay = 1000
    } = options;

    // Check cache
    if (cache && this.isCached(url)) {
      return this.getFromCache(url);
    }

    // Check rate limit
    if (this.isRateLimited(url)) {
      throw new Error('RateLimitError');
    }

    // Deduplicate concurrent requests
    if (this.requestQueue.has(url)) {
      return this.requestQueue.get(url);
    }

    const requestPromise = this.executeRequest(url, timeout, retry, retryDelay);
    this.requestQueue.set(url, requestPromise);

    try {
      const data = await requestPromise;
      
      if (cache) {
        this.setCache(url, data, cacheTTL);
      }

      this.requestQueue.delete(url);
      this.updateRateLimit(url);
      
      return data;
    } catch (error) {
      this.requestQueue.delete(url);
      throw error;
    }
  }

  // Execute request with timeout and retry
  async executeRequest(url, timeout, retries, retryDelay) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'ArLux/2.0'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('RateLimitError');
          }
          if (response.status === 404) {
            throw new Error('NotFoundError');
          }
          throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('TimeoutError');
        }

        if (attempt === retries) {
          throw new Error('NetworkError');
        }

        // Wait before retry
        await this.delay(retryDelay * (attempt + 1));
      }
    }
  }

  // POST request
  async post(url, data, options = {}) {
    const { timeout = 10000 } = options;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('TimeoutError');
      }
      throw new Error('NetworkError');
    }
  }

  // PUT request
  async put(url, data, options = {}) {
    const { timeout = 10000 } = options;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': options.apiKey || ''
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('TimeoutError');
      }
      throw new Error('NetworkError');
    }
  }

  // Cache management
  isCached(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const isExpired = Date.now() > cached.expiry;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  getFromCache(key) {
    return this.cache.get(key).data;
  }

  setCache(key, data, ttl) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  clearCache() {
    this.cache.clear();
  }

  // Rate limiting
  isRateLimited(url) {
    const domain = new URL(url).hostname;
    const limit = this.rateLimits.get(domain);
    
    if (!limit) return false;
    
    const now = Date.now();
    const requests = limit.requests.filter(time => now - time < 60000);
    
    return requests.length >= 100; // 100 requests per minute
  }

  updateRateLimit(url) {
    const domain = new URL(url).hostname;
    const limit = this.rateLimits.get(domain) || { requests: [] };
    
    limit.requests.push(Date.now());
    limit.requests = limit.requests.filter(time => Date.now() - time < 60000);
    
    this.rateLimits.set(domain, limit);
  }

  // Utility
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Global instance
window.apiService = new APIService();

export default window.apiService;
