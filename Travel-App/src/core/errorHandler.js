// Error Handling System
class AppError extends Error {
    constructor(message, code, statusCode = 500) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        this.timestamp = new Date().toISOString();
    }
}

class ErrorHandler {
    constructor() {
        this.errors = [];
        this.maxErrors = 100;
        this.setupGlobalHandlers();
    }
    
    setupGlobalHandlers() {
        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handle(new AppError(
                event.reason?.message || 'Unhandled promise rejection',
                'UNHANDLED_REJECTION',
                500
            ));
            event.preventDefault();
        });
        
        // Catch global errors
        window.addEventListener('error', (event) => {
            this.handle(new AppError(
                event.message || 'Global error',
                'GLOBAL_ERROR',
                500
            ));
        });
    }
    
    handle(error) {
        // Log error
        console.error('[ErrorHandler]', error);
        
        // Store error
        this.errors.push({
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
            timestamp: error.timestamp || new Date().toISOString(),
            stack: error.stack
        });
        
        // Keep only last 100 errors
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }
        
        // Save to localStorage for debugging
        try {
            localStorage.setItem('app-errors', JSON.stringify(this.errors.slice(-10)));
        } catch (e) {
            console.warn('Failed to save errors to localStorage');
        }
        
        // Send to error tracking service (Sentry)
        this.reportToSentry(error);
        
        // Show user-friendly message
        this.showUserMessage(error);
    }
    
    reportToSentry(error) {
        // TODO: Integrate with Sentry
        if (window.Sentry) {
            window.Sentry.captureException(error);
        }
    }
    
    showUserMessage(error) {
        const userMessage = this.getUserFriendlyMessage(error);
        showToast(userMessage, 'error');
    }
    
    getUserFriendlyMessage(error) {
        const messages = {
            'NETWORK_ERROR': 'Network connection failed. Please check your internet.',
            'API_ERROR': 'Failed to load data. Please try again.',
            'RATE_LIMIT': 'Too many requests. Please wait a moment.',
            'VALIDATION_ERROR': 'Invalid input. Please check your data.',
            'NOT_FOUND': 'Resource not found.',
            'TIMEOUT': 'Request timed out. Please try again.',
            'UNAUTHORIZED': 'Authentication required.',
            'FORBIDDEN': 'Access denied.',
            'SERVER_ERROR': 'Server error. Please try again later.'
        };
        
        return messages[error.code] || 'Something went wrong. Please try again.';
    }
    
    getErrors() {
        return this.errors;
    }
    
    clearErrors() {
        this.errors = [];
        localStorage.removeItem('app-errors');
    }
}

// Toast notification system
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${getToastIcon(type)}</span>
            <span class="toast-message">${escapeHtml(message)}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('toast-show'), 10);
    
    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function getToastIcon(type) {
    const icons = {
        'success': '✓',
        'error': '✕',
        'warning': '⚠',
        'info': 'ℹ'
    };
    return icons[type] || icons.info;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Create global error handler instance
const errorHandler = new ErrorHandler();

// Export
export { AppError, errorHandler, showToast };
