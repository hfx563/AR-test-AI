// Input Validation System
import { AppError } from '../core/errorHandler.js';

class Validator {
    // Sanitize HTML to prevent XSS
    sanitizeHTML(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }
    
    // Validate and sanitize text input
    validateText(input, options = {}) {
        const {
            minLength = 0,
            maxLength = 1000,
            required = false,
            allowSpecialChars = true
        } = options;
        
        if (required && (!input || input.trim() === '')) {
            throw new AppError('This field is required', 'VALIDATION_ERROR', 400);
        }
        
        if (!input) return '';
        
        const text = input.trim();
        
        if (text.length < minLength) {
            throw new AppError(
                `Minimum length is ${minLength} characters`,
                'VALIDATION_ERROR',
                400
            );
        }
        
        if (text.length > maxLength) {
            throw new AppError(
                `Maximum length is ${maxLength} characters`,
                'VALIDATION_ERROR',
                400
            );
        }
        
        // Check for malicious patterns
        if (this.containsMaliciousCode(text)) {
            throw new AppError(
                'Invalid characters detected',
                'VALIDATION_ERROR',
                400
            );
        }
        
        if (!allowSpecialChars && /[<>{}[\]\\]/.test(text)) {
            throw new AppError(
                'Special characters not allowed',
                'VALIDATION_ERROR',
                400
            );
        }
        
        return this.sanitizeHTML(text);
    }
    
    // Check for malicious code patterns
    containsMaliciousCode(input) {
        const maliciousPatterns = [
            /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi, // onclick, onerror, etc.
            /<iframe/gi,
            /<object/gi,
            /<embed/gi,
            /eval\(/gi,
            /expression\(/gi
        ];
        
        return maliciousPatterns.some(pattern => pattern.test(input));
    }
    
    // Validate username
    validateUsername(username) {
        return this.validateText(username, {
            minLength: 2,
            maxLength: 30,
            required: true,
            allowSpecialChars: false
        });
    }
    
    // Validate chat message
    validateChatMessage(message) {
        return this.validateText(message, {
            minLength: 1,
            maxLength: 500,
            required: true,
            allowSpecialChars: true
        });
    }
    
    // Validate city name
    validateCityName(cityName) {
        return this.validateText(cityName, {
            minLength: 2,
            maxLength: 100,
            required: true,
            allowSpecialChars: false
        });
    }
    
    // Validate coordinates
    validateCoordinates(lat, lon) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        
        if (isNaN(latitude) || latitude < -90 || latitude > 90) {
            throw new AppError('Invalid latitude', 'VALIDATION_ERROR', 400);
        }
        
        if (isNaN(longitude) || longitude < -180 || longitude > 180) {
            throw new AppError('Invalid longitude', 'VALIDATION_ERROR', 400);
        }
        
        return { lat: latitude, lon: longitude };
    }
    
    // Validate URL
    validateURL(url) {
        try {
            const parsed = new URL(url);
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                throw new Error('Invalid protocol');
            }
            return parsed.href;
        } catch (error) {
            throw new AppError('Invalid URL', 'VALIDATION_ERROR', 400);
        }
    }
    
    // Validate email (if needed for future features)
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new AppError('Invalid email address', 'VALIDATION_ERROR', 400);
        }
        return email.toLowerCase().trim();
    }
    
    // Rate limit check for user actions
    checkActionRateLimit(action, maxActions = 10, timeWindow = 60000) {
        const key = `ratelimit-${action}`;
        const now = Date.now();
        
        let actions = JSON.parse(localStorage.getItem(key) || '[]');
        
        // Remove old actions
        actions = actions.filter(time => now - time < timeWindow);
        
        if (actions.length >= maxActions) {
            throw new AppError(
                'Too many actions. Please wait a moment.',
                'RATE_LIMIT',
                429
            );
        }
        
        actions.push(now);
        localStorage.setItem(key, JSON.stringify(actions));
        
        return true;
    }
}

// Create singleton instance
const validator = new Validator();

export default validator;
