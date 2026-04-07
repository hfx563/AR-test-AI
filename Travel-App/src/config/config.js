// Configuration Module
const CONFIG = {
    // API Endpoints
    API: {
        GEONAMES: 'https://secure.geonames.org',
        OPENSTREETMAP: 'https://nominatim.openstreetmap.org',
        OPEN_METEO: 'https://api.open-meteo.com/v1',
        WIKIPEDIA: 'https://en.wikipedia.org',
        OVERPASS: 'https://overpass-api.de/api',
        RSS2JSON: 'https://api.rss2json.com/v1/api.json',
        IPAPI: 'https://ipapi.co',
        IPIFY: 'https://api.ipify.org',
        UNSPLASH: 'https://source.unsplash.com'
    },
    
    // API Keys (will be moved to backend)
    KEYS: {
        GEONAMES_USERNAME: 'demo' // Replace with your username
    },
    
    // Rate Limiting
    RATE_LIMIT: {
        MAX_REQUESTS_PER_MINUTE: 60,
        RETRY_AFTER: 60000 // 1 minute
    },
    
    // Cache Settings
    CACHE: {
        CITY_DATA_TTL: 3600000, // 1 hour
        WEATHER_TTL: 1800000, // 30 minutes
        NEWS_TTL: 600000, // 10 minutes
        PLACES_TTL: 3600000 // 1 hour
    },
    
    // Chat Settings
    CHAT: {
        POLL_INTERVAL: 2000, // 2 seconds
        MAX_MESSAGES: 100,
        MAX_MESSAGE_LENGTH: 500,
        STORAGE_KEY: 'luxe-travel-chat-messages',
        USER_KEY: 'luxe-travel-chat-username'
    },
    
    // UI Settings
    UI: {
        TOAST_DURATION: 3000,
        ANIMATION_DURATION: 300,
        DEBOUNCE_DELAY: 300
    },
    
    // Feature Flags
    FEATURES: {
        CHAT_ENABLED: true,
        CAMERA_ENABLED: true,
        MUSIC_ENABLED: true,
        ANALYTICS_ENABLED: true,
        ERROR_TRACKING_ENABLED: true
    },
    
    // Environment
    ENV: 'production', // 'development' | 'production'
    VERSION: '1.0.0'
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);

export default CONFIG;
