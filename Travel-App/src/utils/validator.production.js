// Input Validator with XSS Protection
class Validator {
  constructor() {
    this.patterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      username: /^[a-zA-Z0-9_-]{3,20}$/,
      cityName: /^[a-zA-Z\s\-']{2,50}$/,
      url: /^https?:\/\/.+/
    };

    this.dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi
    ];
  }

  // Sanitize HTML to prevent XSS
  sanitizeHTML(input) {
    if (!input) return '';
    
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  // Validate and sanitize username
  validateUsername(username) {
    if (!username || typeof username !== 'string') {
      throw new Error('ValidationError: Username is required');
    }

    const sanitized = this.sanitizeHTML(username.trim());
    
    if (sanitized.length < 3 || sanitized.length > 20) {
      throw new Error('ValidationError: Username must be 3-20 characters');
    }

    if (!this.patterns.username.test(sanitized)) {
      throw new Error('ValidationError: Username can only contain letters, numbers, - and _');
    }

    return sanitized;
  }

  // Validate city name
  validateCityName(cityName) {
    if (!cityName || typeof cityName !== 'string') {
      throw new Error('ValidationError: City name is required');
    }

    const sanitized = this.sanitizeHTML(cityName.trim());
    
    if (sanitized.length < 2 || sanitized.length > 50) {
      throw new Error('ValidationError: City name must be 2-50 characters');
    }

    if (!this.patterns.cityName.test(sanitized)) {
      throw new Error('ValidationError: Invalid city name format');
    }

    return sanitized;
  }

  // Validate chat message
  validateChatMessage(message) {
    if (!message || typeof message !== 'string') {
      throw new Error('ValidationError: Message is required');
    }

    const sanitized = this.sanitizeHTML(message.trim());
    
    if (sanitized.length === 0) {
      throw new Error('ValidationError: Message cannot be empty');
    }

    if (sanitized.length > 500) {
      throw new Error('ValidationError: Message too long (max 500 characters)');
    }

    // Check for malicious patterns
    if (this.containsMaliciousCode(sanitized)) {
      throw new Error('ValidationError: Message contains invalid content');
    }

    return sanitized;
  }

  // Check for malicious code
  containsMaliciousCode(input) {
    return this.dangerousPatterns.some(pattern => pattern.test(input));
  }

  // Validate email
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      throw new Error('ValidationError: Email is required');
    }

    const sanitized = this.sanitizeHTML(email.trim().toLowerCase());
    
    if (!this.patterns.email.test(sanitized)) {
      throw new Error('ValidationError: Invalid email format');
    }

    return sanitized;
  }

  // Validate URL
  validateURL(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('ValidationError: URL is required');
    }

    const sanitized = url.trim();
    
    if (!this.patterns.url.test(sanitized)) {
      throw new Error('ValidationError: Invalid URL format');
    }

    try {
      new URL(sanitized);
      return sanitized;
    } catch {
      throw new Error('ValidationError: Malformed URL');
    }
  }

  // Validate coordinates
  validateCoordinates(lat, lon) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      throw new Error('ValidationError: Invalid latitude');
    }

    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      throw new Error('ValidationError: Invalid longitude');
    }

    return { lat: latitude, lon: longitude };
  }

  // Rate limiting check
  checkRateLimit(key, maxAttempts = 10, windowMs = 60000) {
    const now = Date.now();
    const attempts = JSON.parse(localStorage.getItem(`rateLimit_${key}`) || '[]');
    
    // Filter attempts within window
    const recentAttempts = attempts.filter(time => now - time < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      throw new Error('RateLimitError: Too many attempts. Please wait.');
    }

    // Add current attempt
    recentAttempts.push(now);
    localStorage.setItem(`rateLimit_${key}`, JSON.stringify(recentAttempts));
    
    return true;
  }

  // Clear rate limit
  clearRateLimit(key) {
    localStorage.removeItem(`rateLimit_${key}`);
  }
}

// Global instance
window.validator = new Validator();

export default window.validator;
