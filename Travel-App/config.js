// Environment Configuration
const ENV = {
  CHAT_API_URL: 'https://api.jsonbin.io/v3/b/679d8e3ead19ca34f8e7c123',
  CHAT_API_KEY: '$2a$10$vZ8qN5xK3mH9pL2wR4tY6eX1cF7bG9hJ5kM3nP8qS2vT4wU6yA0zO',
  GEONAMES_USERNAME: 'demo',
  POLL_INTERVAL: 3000,
  MAX_MESSAGES: 100,
  CACHE_TTL: 600000,
  REQUEST_TIMEOUT: 10000,
  MAX_RETRIES: 3
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ENV;
} else {
  window.ENV = ENV;
}
