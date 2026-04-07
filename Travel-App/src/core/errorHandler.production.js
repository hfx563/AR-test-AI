// Global Error Handler with User-Friendly Messages
class ErrorHandler {
  constructor() {
    this.errors = [];
    this.maxErrors = 50;
  }

  handle(error, context = '') {
    const errorObj = {
      message: error.message || 'Unknown error',
      context,
      timestamp: new Date().toISOString(),
      stack: error.stack
    };

    this.errors.push(errorObj);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    console.error(`[${context}]`, error);
    this.showToast(this.getUserFriendlyMessage(error, context), 'error');
    
    // Send to monitoring service (future)
    this.reportError(errorObj);
  }

  getUserFriendlyMessage(error, context) {
    const messages = {
      'NetworkError': 'Unable to connect. Please check your internet connection.',
      'TimeoutError': 'Request timed out. Please try again.',
      'NotFoundError': 'The requested resource was not found.',
      'ValidationError': 'Please check your input and try again.',
      'AuthError': 'Authentication failed. Please refresh the page.',
      'RateLimitError': 'Too many requests. Please wait a moment.',
      'CitySearch': 'Unable to search cities. Please try again.',
      'Weather': 'Unable to load weather data.',
      'Places': 'Unable to load places.',
      'News': 'Unable to load news.',
      'Chat': 'Unable to send message. Please try again.'
    };

    return messages[context] || messages[error.name] || 'Something went wrong. Please try again.';
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${this.getIcon(type)}</span>
        <span class="toast-message">${message}</span>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    const container = document.getElementById('toastContainer') || this.createToastContainer();
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  }

  createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  }

  reportError(errorObj) {
    // Future: Send to Sentry, LogRocket, etc.
    if (window.Sentry) {
      window.Sentry.captureException(errorObj);
    }
  }

  getErrors() {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
  }
}

// Global instance
window.errorHandler = new ErrorHandler();

// Global error listeners
window.addEventListener('error', (event) => {
  window.errorHandler.handle(event.error, 'Global');
});

window.addEventListener('unhandledrejection', (event) => {
  window.errorHandler.handle(new Error(event.reason), 'Promise');
});

export default window.errorHandler;
