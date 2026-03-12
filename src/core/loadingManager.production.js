// Loading State Manager
class LoadingManager {
  constructor() {
    this.activeLoaders = new Set();
  }

  // Show loading spinner
  show(elementId, type = 'spinner') {
    this.activeLoaders.add(elementId);
    const element = document.getElementById(elementId);
    if (!element) return;

    const loader = this.createLoader(type);
    element.innerHTML = '';
    element.appendChild(loader);
  }

  // Hide loading and restore content
  hide(elementId) {
    this.activeLoaders.delete(elementId);
  }

  // Create different types of loaders
  createLoader(type) {
    const loaders = {
      spinner: this.createSpinner(),
      skeleton: this.createSkeleton(),
      dots: this.createDots(),
      bar: this.createProgressBar()
    };
    return loaders[type] || loaders.spinner;
  }

  createSpinner() {
    const spinner = document.createElement('div');
    spinner.className = 'loader-spinner';
    spinner.innerHTML = `
      <div class="spinner-circle"></div>
      <p class="spinner-text">Loading...</p>
    `;
    return spinner;
  }

  createSkeleton() {
    const skeleton = document.createElement('div');
    skeleton.className = 'loader-skeleton';
    skeleton.innerHTML = `
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
    `;
    return skeleton;
  }

  createDots() {
    const dots = document.createElement('div');
    dots.className = 'loader-dots';
    dots.innerHTML = `
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    `;
    return dots;
  }

  createProgressBar() {
    const bar = document.createElement('div');
    bar.className = 'loader-progress';
    bar.innerHTML = `
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
    `;
    return bar;
  }

  // Show button loading state
  buttonLoading(buttonId, loading = true) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    if (loading) {
      button.disabled = true;
      button.dataset.originalText = button.innerHTML;
      button.innerHTML = `
        <span class="btn-spinner"></span>
        <span>Loading...</span>
      `;
      button.classList.add('loading');
    } else {
      button.disabled = false;
      button.innerHTML = button.dataset.originalText || button.innerHTML;
      button.classList.remove('loading');
    }
  }

  // Show skeleton for cards
  showCardSkeleton(containerId, count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const card = document.createElement('div');
      card.className = 'skeleton-card';
      card.innerHTML = `
        <div class="skeleton-image"></div>
        <div class="skeleton-content">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      `;
      container.appendChild(card);
    }
  }

  // Check if any loaders are active
  isLoading() {
    return this.activeLoaders.size > 0;
  }

  // Clear all loaders
  clearAll() {
    this.activeLoaders.clear();
  }
}

// Global instance
window.loadingManager = new LoadingManager();

export default window.loadingManager;
