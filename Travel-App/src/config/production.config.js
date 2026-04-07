// Production Configuration
export const config = {
  // API Endpoints
  api: {
    geonames: {
      baseUrl: 'https://secure.geonames.org',
      username: 'demo', // TODO: Replace with env variable
      maxResults: 10
    },
    openStreetMap: {
      baseUrl: 'https://nominatim.openstreetmap.org',
      userAgent: 'ArLux/1.0'
    },
    weather: {
      baseUrl: 'https://api.open-meteo.com/v1'
    },
    chat: {
      baseUrl: 'https://api.jsonbin.io/v3/b/679d8e3ead19ca34f8e7c123',
      apiKey: '$2a$10$vZ8qN5xK3mH9pL2wR4tY6eX1cF7bG9hJ5kM3nP8qS2vT4wU6yA0zO'
    },
    news: {
      rss2json: 'https://api.rss2json.com/v1/api.json',
      allOrigins: 'https://api.allorigins.win'
    }
  },

  // Cache Settings
  cache: {
    ttl: {
      citySearch: 3600000, // 1 hour
      weather: 600000, // 10 minutes
      places: 1800000, // 30 minutes
      news: 300000 // 5 minutes
    }
  },

  // Rate Limiting
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000 // 1 minute
  },

  // Feature Flags
  features: {
    chat: true,
    camera: true,
    music: true,
    news: true,
    offlineMode: true
  },

  // App Settings
  app: {
    name: 'ArLux',
    version: '2.0.0',
    pollInterval: 3000,
    maxChatMessages: 100,
    maxPlacesResults: 15
  }
};
