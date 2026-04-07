// API Service Layer with Error Handling, Caching, and Rate Limiting
import { AppError, errorHandler } from '../core/errorHandler.js';
import CONFIG from '../config/config.js';

class APIService {
    constructor() {
        this.cache = new Map();
        this.requestCounts = new Map();
        this.pendingRequests = new Map();
    }
    
    // Generic fetch with error handling
    async fetch(url, options = {}) {
        const cacheKey = `${url}-${JSON.stringify(options)}`;
        
        // Check cache
        if (options.cache !== false) {
            const cached = this.getFromCache(cacheKey);
            if (cached) return cached;
        }
        
        // Check rate limit
        if (!this.checkRateLimit(url)) {
            throw new AppError(
                'Rate limit exceeded. Please wait.',
                'RATE_LIMIT',
                429
            );
        }
        
        // Deduplicate concurrent requests
        if (this.pendingRequests.has(cacheKey)) {
            return this.pendingRequests.get(cacheKey);
        }
        
        const requestPromise = this._executeRequest(url, options, cacheKey);
        this.pendingRequests.set(cacheKey, requestPromise);
        
        try {
            const result = await requestPromise;
            return result;
        } finally {
            this.pendingRequests.delete(cacheKey);
        }
    }
    
    async _executeRequest(url, options, cacheKey) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), options.timeout || 10000);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeout);
            
            if (!response.ok) {
                throw new AppError(
                    `HTTP ${response.status}: ${response.statusText}`,
                    'API_ERROR',
                    response.status
                );
            }
            
            const data = await response.json();
            
            // Cache successful response
            if (options.cacheTTL) {
                this.setCache(cacheKey, data, options.cacheTTL);
            }
            
            return data;
            
        } catch (error) {
            clearTimeout(timeout);
            
            if (error.name === 'AbortError') {
                throw new AppError('Request timeout', 'TIMEOUT', 408);
            }
            
            if (error instanceof AppError) {
                throw error;
            }
            
            throw new AppError(
                'Network request failed',
                'NETWORK_ERROR',
                0
            );
        }
    }
    
    // Rate limiting
    checkRateLimit(url) {
        const now = Date.now();
        const key = new URL(url).hostname;
        
        if (!this.requestCounts.has(key)) {
            this.requestCounts.set(key, []);
        }
        
        const requests = this.requestCounts.get(key);
        
        // Remove requests older than 1 minute
        const recentRequests = requests.filter(time => now - time < 60000);
        
        if (recentRequests.length >= CONFIG.RATE_LIMIT.MAX_REQUESTS_PER_MINUTE) {
            return false;
        }
        
        recentRequests.push(now);
        this.requestCounts.set(key, recentRequests);
        
        return true;
    }
    
    // Cache management
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() > cached.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    setCache(key, data, ttl) {
        this.cache.set(key, {
            data,
            expiry: Date.now() + ttl
        });
        
        // Limit cache size
        if (this.cache.size > 100) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }
    
    clearCache() {
        this.cache.clear();
    }
    
    // Specific API methods
    async searchCity(query) {
        if (!query || query.length < 2) {
            throw new AppError('Search query too short', 'VALIDATION_ERROR', 400);
        }
        
        const url = `${CONFIG.API.GEONAMES}/searchJSON?name_startsWith=${encodeURIComponent(query)}&featureClass=P&maxRows=5&username=${CONFIG.KEYS.GEONAMES_USERNAME}`;
        
        return this.fetch(url, {
            cacheTTL: CONFIG.CACHE.CITY_DATA_TTL
        });
    }
    
    async getWeather(lat, lon) {
        if (!lat || !lon) {
            throw new AppError('Invalid coordinates', 'VALIDATION_ERROR', 400);
        }
        
        const url = `${CONFIG.API.OPEN_METEO}/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
        
        return this.fetch(url, {
            cacheTTL: CONFIG.CACHE.WEATHER_TTL
        });
    }
    
    async geocodeCity(cityName) {
        if (!cityName) {
            throw new AppError('City name required', 'VALIDATION_ERROR', 400);
        }
        
        const url = `${CONFIG.API.OPENSTREETMAP}/search?city=${encodeURIComponent(cityName)}&format=json&limit=10&addressdetails=1`;
        
        return this.fetch(url, {
            cacheTTL: CONFIG.CACHE.CITY_DATA_TTL,
            headers: {
                'User-Agent': 'LuxeTravel/1.0'
            }
        });
    }
    
    async getNews(feedUrl) {
        if (!feedUrl) {
            throw new AppError('Feed URL required', 'VALIDATION_ERROR', 400);
        }
        
        const url = `${CONFIG.API.RSS2JSON}?rss_url=${encodeURIComponent(feedUrl)}`;
        
        return this.fetch(url, {
            cacheTTL: CONFIG.CACHE.NEWS_TTL
        });
    }
    
    async getUserIP() {
        try {
            const data = await this.fetch(`${CONFIG.API.IPAPI}/json/`, {
                cacheTTL: 3600000 // 1 hour
            });
            return data;
        } catch (error) {
            // Fallback to ipify
            const data = await this.fetch(`${CONFIG.API.IPIFY}?format=json`, {
                cacheTTL: 3600000
            });
            return { ip: data.ip };
        }
    }
}

// Create singleton instance
const apiService = new APIService();

export default apiService;
