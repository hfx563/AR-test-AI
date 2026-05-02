// Validator Unit Tests
const { AppError } = require('../src/core/errorHandler.cjs');
const validator = require('../src/utils/validator.cjs');

describe('Validator', () => {
    describe('sanitizeHTML', () => {
        test('should escape HTML tags', () => {
            const malicious = '<script>alert("xss")</script>';
            const safe = validator.sanitizeHTML(malicious);
            expect(safe).not.toContain('<script>');
            expect(safe).toContain('&lt;script&gt;');
        });
        
        test('should handle normal text', () => {
            const text = 'Hello World';
            const result = validator.sanitizeHTML(text);
            expect(result).toBe('Hello World');
        });
    });
    
    describe('validateText', () => {
        test('should accept valid text', () => {
            const result = validator.validateText('Hello World');
            expect(result).toBe('Hello World');
        });
        
        test('should trim whitespace', () => {
            const result = validator.validateText('  Hello  ');
            expect(result).toBe('Hello');
        });
        
        test('should throw error for text too short', () => {
            expect(() => {
                validator.validateText('a', { minLength: 2 });
            }).toThrow(AppError);
        });
        
        test('should throw error for text too long', () => {
            const longText = 'a'.repeat(1001);
            expect(() => {
                validator.validateText(longText, { maxLength: 1000 });
            }).toThrow(AppError);
        });
        
        test('should throw error for required empty field', () => {
            expect(() => {
                validator.validateText('', { required: true });
            }).toThrow(AppError);
        });
    });
    
    describe('containsMaliciousCode', () => {
        test('should detect script tags', () => {
            expect(validator.containsMaliciousCode('<script>alert(1)</script>')).toBe(true);
        });
        
        test('should detect javascript: protocol', () => {
            expect(validator.containsMaliciousCode('javascript:alert(1)')).toBe(true);
        });
        
        test('should detect event handlers', () => {
            expect(validator.containsMaliciousCode('<img onerror="alert(1)">')).toBe(true);
        });
        
        test('should allow safe text', () => {
            expect(validator.containsMaliciousCode('Hello World')).toBe(false);
        });
    });
    
    describe('validateUsername', () => {
        test('should accept valid username', () => {
            const result = validator.validateUsername('Alice');
            expect(result).toBe('Alice');
        });
        
        test('should reject too short username', () => {
            expect(() => {
                validator.validateUsername('a');
            }).toThrow(AppError);
        });
        
        test('should reject too long username', () => {
            const longName = 'a'.repeat(31);
            expect(() => {
                validator.validateUsername(longName);
            }).toThrow(AppError);
        });
    });
    
    describe('validateChatMessage', () => {
        test('should accept valid message', () => {
            const result = validator.validateChatMessage('Hello!');
            expect(result).toBe('Hello!');
        });
        
        test('should reject empty message', () => {
            expect(() => {
                validator.validateChatMessage('');
            }).toThrow(AppError);
        });
        
        test('should reject message too long', () => {
            const longMsg = 'a'.repeat(501);
            expect(() => {
                validator.validateChatMessage(longMsg);
            }).toThrow(AppError);
        });
    });
    
    describe('validateCoordinates', () => {
        test('should accept valid coordinates', () => {
            const result = validator.validateCoordinates(40.7128, -74.0060);
            expect(result).toEqual({ lat: 40.7128, lon: -74.0060 });
        });
        
        test('should reject invalid latitude', () => {
            expect(() => {
                validator.validateCoordinates(91, 0);
            }).toThrow(AppError);
        });
        
        test('should reject invalid longitude', () => {
            expect(() => {
                validator.validateCoordinates(0, 181);
            }).toThrow(AppError);
        });
    });
    
    describe('validateURL', () => {
        test('should accept valid HTTP URL', () => {
            const result = validator.validateURL('http://example.com');
            expect(result).toBe('http://example.com/');
        });
        
        test('should accept valid HTTPS URL', () => {
            const result = validator.validateURL('https://example.com');
            expect(result).toBe('https://example.com/');
        });
        
        test('should reject invalid URL', () => {
            expect(() => {
                validator.validateURL('not-a-url');
            }).toThrow(AppError);
        });
        
        test('should reject non-HTTP protocol', () => {
            expect(() => {
                validator.validateURL('ftp://example.com');
            }).toThrow(AppError);
        });
    });
});
