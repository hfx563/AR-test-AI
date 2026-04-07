// Security Configuration for Luxe Travel App

// Rate Limiting Configuration
const RATE_LIMITS = {
    API_CALLS: 50,        // Max API calls per minute
    SEARCH: 20,           // Max searches per minute
    NEWS: 10              // Max news requests per minute
};

// Allowed API Domains (Whitelist)
const ALLOWED_DOMAINS = [
    'secure.geonames.org',
    'nominatim.openstreetmap.org',
    'api.open-meteo.com',
    'en.wikipedia.org',
    'overpass-api.de',
    'api.rss2json.com',
    'api.allorigins.win',
    'source.unsplash.com',
    'images.unsplash.com'
];

// Content Security Policy
const CSP_POLICY = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    'font-src': ["'self'", "https://fonts.gstatic.com"],
    'img-src': ["'self'", "https:", "data:"],
    'connect-src': ["'self'", ...ALLOWED_DOMAINS.map(d => `https://${d}`)]
};

// Export for use in app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RATE_LIMITS, ALLOWED_DOMAINS, CSP_POLICY };
}
