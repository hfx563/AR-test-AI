// Loading States and Skeleton Loaders
class LoadingManager {
    constructor() {
        this.activeLoaders = new Set();
    }
    
    // Show loading overlay
    showOverlay(message = 'Loading...') {
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-message">${message}</div>
        `;
        document.body.appendChild(overlay);
        return overlay;
    }
    
    // Hide loading overlay
    hideOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('loading-fade-out');
            setTimeout(() => overlay.remove(), 300);
        }
    }
    
    // Show skeleton loader in container
    showSkeleton(containerId, type = 'default') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const skeleton = this.createSkeleton(type);
        container.innerHTML = skeleton;
        this.activeLoaders.add(containerId);
    }
    
    // Hide skeleton loader
    hideSkeleton(containerId) {
        this.activeLoaders.delete(containerId);
    }
    
    // Create skeleton HTML based on type
    createSkeleton(type) {
        const skeletons = {
            'default': `
                <div class="skeleton-loader">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                </div>
            `,
            'city-info': `
                <div class="skeleton-loader">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-stats">
                        <div class="skeleton-stat"></div>
                        <div class="skeleton-stat"></div>
                        <div class="skeleton-stat"></div>
                        <div class="skeleton-stat"></div>
                    </div>
                </div>
            `,
            'places': `
                <div class="skeleton-loader">
                    ${Array(3).fill('').map(() => `
                        <div class="skeleton-place-card">
                            <div class="skeleton-image"></div>
                            <div class="skeleton-content">
                                <div class="skeleton-line"></div>
                                <div class="skeleton-line short"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `,
            'news': `
                <div class="skeleton-loader skeleton-news-grid">
                    ${Array(6).fill('').map(() => `
                        <div class="skeleton-news-card">
                            <div class="skeleton-image"></div>
                            <div class="skeleton-content">
                                <div class="skeleton-line"></div>
                                <div class="skeleton-line"></div>
                                <div class="skeleton-line short"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `,
            'chat': `
                <div class="skeleton-loader">
                    ${Array(5).fill('').map((_, i) => `
                        <div class="skeleton-chat-message ${i % 2 === 0 ? 'own' : ''}">
                            <div class="skeleton-line short"></div>
                            <div class="skeleton-line"></div>
                        </div>
                    `).join('')}
                </div>
            `
        };
        
        return skeletons[type] || skeletons.default;
    }
    
    // Show inline loader (for buttons)
    showButtonLoader(buttonElement) {
        if (!buttonElement) return;
        
        buttonElement.disabled = true;
        buttonElement.dataset.originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = '<span class="button-spinner"></span>';
        buttonElement.classList.add('loading');
    }
    
    // Hide inline loader
    hideButtonLoader(buttonElement) {
        if (!buttonElement) return;
        
        buttonElement.disabled = false;
        buttonElement.innerHTML = buttonElement.dataset.originalText || 'Submit';
        buttonElement.classList.remove('loading');
        delete buttonElement.dataset.originalText;
    }
    
    // Show progress bar
    showProgress(percentage) {
        let progressBar = document.getElementById('progress-bar');
        
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.id = 'progress-bar';
            progressBar.className = 'progress-bar';
            progressBar.innerHTML = '<div class="progress-fill"></div>';
            document.body.appendChild(progressBar);
        }
        
        const fill = progressBar.querySelector('.progress-fill');
        fill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        
        if (percentage >= 100) {
            setTimeout(() => this.hideProgress(), 500);
        }
    }
    
    // Hide progress bar
    hideProgress() {
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.classList.add('progress-fade-out');
            setTimeout(() => progressBar.remove(), 300);
        }
    }
    
    // Clear all loaders
    clearAll() {
        this.hideOverlay();
        this.hideProgress();
        this.activeLoaders.forEach(id => {
            const container = document.getElementById(id);
            if (container) container.innerHTML = '';
        });
        this.activeLoaders.clear();
    }
}

// Create singleton instance
const loadingManager = new LoadingManager();

export default loadingManager;
