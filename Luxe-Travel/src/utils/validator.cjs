const { AppError } = require('../core/errorHandler.cjs');

class Validator {
    sanitizeHTML(input) {
        return String(input)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    validateText(input, options = {}) {
        const { minLength = 0, maxLength = 1000, required = false, allowSpecialChars = true } = options;

        if (required && (!input || input.trim() === '')) {
            throw new AppError('This field is required', 'VALIDATION_ERROR', 400);
        }

        if (!input) return '';

        const text = input.trim();

        if (text.length < minLength) {
            throw new AppError(`Minimum length is ${minLength} characters`, 'VALIDATION_ERROR', 400);
        }

        if (text.length > maxLength) {
            throw new AppError(`Maximum length is ${maxLength} characters`, 'VALIDATION_ERROR', 400);
        }

        if (this.containsMaliciousCode(text)) {
            throw new AppError('Invalid characters detected', 'VALIDATION_ERROR', 400);
        }

        if (!allowSpecialChars && /[<>{}[\]\\]/.test(text)) {
            throw new AppError('Special characters not allowed', 'VALIDATION_ERROR', 400);
        }

        return this.sanitizeHTML(text);
    }

    containsMaliciousCode(input) {
        const maliciousPatterns = [
            /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe/gi,
            /<object/gi,
            /<embed/gi,
            /eval\(/gi,
            /expression\(/gi
        ];
        return maliciousPatterns.some(pattern => pattern.test(input));
    }

    validateUsername(username) {
        return this.validateText(username, { minLength: 2, maxLength: 30, required: true, allowSpecialChars: false });
    }

    validateChatMessage(message) {
        return this.validateText(message, { minLength: 1, maxLength: 500, required: true, allowSpecialChars: true });
    }

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
}

module.exports = new Validator();
