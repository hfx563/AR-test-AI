// State Management System
class StateManager {
    constructor() {
        this.state = {
            // User state
            user: {
                username: null,
                favorites: [],
                searchHistory: []
            },
            
            // City state
            city: {
                current: null,
                coordinates: null,
                weather: null,
                places: []
            },
            
            // Chat state
            chat: {
                messages: [],
                isOpen: false,
                isPolling: false
            },
            
            // UI state
            ui: {
                loading: false,
                error: null,
                activeModal: null,
                selectedCategory: null
            },
            
            // App state
            app: {
                online: navigator.onLine,
                initialized: false
            }
        };
        
        this.listeners = new Map();
        this.setupOnlineListener();
    }
    
    // Get state
    get(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.state);
    }
    
    // Set state
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => obj[key], this.state);
        
        const oldValue = target[lastKey];
        target[lastKey] = value;
        
        // Notify listeners
        this.notify(path, value, oldValue);
        
        // Persist certain state to localStorage
        this.persist(path);
    }
    
    // Update state (merge)
    update(path, updates) {
        const current = this.get(path);
        if (typeof current === 'object' && !Array.isArray(current)) {
            this.set(path, { ...current, ...updates });
        } else {
            this.set(path, updates);
        }
    }
    
    // Subscribe to state changes
    subscribe(path, callback) {
        if (!this.listeners.has(path)) {
            this.listeners.set(path, new Set());
        }
        this.listeners.get(path).add(callback);
        
        // Return unsubscribe function
        return () => {
            const listeners = this.listeners.get(path);
            if (listeners) {
                listeners.delete(callback);
            }
        };
    }
    
    // Notify listeners
    notify(path, newValue, oldValue) {
        // Notify exact path listeners
        const listeners = this.listeners.get(path);
        if (listeners) {
            listeners.forEach(callback => callback(newValue, oldValue));
        }
        
        // Notify parent path listeners
        const parts = path.split('.');
        for (let i = parts.length - 1; i > 0; i--) {
            const parentPath = parts.slice(0, i).join('.');
            const parentListeners = this.listeners.get(parentPath);
            if (parentListeners) {
                parentListeners.forEach(callback => callback(this.get(parentPath)));
            }
        }
    }
    
    // Persist to localStorage
    persist(path) {
        const persistPaths = ['user', 'city.current', 'chat.messages'];
        
        if (persistPaths.some(p => path.startsWith(p))) {
            try {
                const data = this.get(path.split('.')[0]);
                localStorage.setItem(`state-${path.split('.')[0]}`, JSON.stringify(data));
            } catch (error) {
                console.warn('Failed to persist state:', error);
            }
        }
    }
    
    // Load from localStorage
    loadPersistedState() {
        const keys = ['user', 'city', 'chat'];
        
        keys.forEach(key => {
            try {
                const stored = localStorage.getItem(`state-${key}`);
                if (stored) {
                    const data = JSON.parse(stored);
                    this.state[key] = { ...this.state[key], ...data };
                }
            } catch (error) {
                console.warn(`Failed to load ${key} state:`, error);
            }
        });
    }
    
    // Setup online/offline listener
    setupOnlineListener() {
        window.addEventListener('online', () => {
            this.set('app.online', true);
        });
        
        window.addEventListener('offline', () => {
            this.set('app.online', false);
        });
    }
    
    // Reset state
    reset() {
        this.state = {
            user: { username: null, favorites: [], searchHistory: [] },
            city: { current: null, coordinates: null, weather: null, places: [] },
            chat: { messages: [], isOpen: false, isPolling: false },
            ui: { loading: false, error: null, activeModal: null, selectedCategory: null },
            app: { online: navigator.onLine, initialized: false }
        };
        
        // Clear localStorage
        ['user', 'city', 'chat'].forEach(key => {
            localStorage.removeItem(`state-${key}`);
        });
    }
    
    // Get entire state (for debugging)
    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }
}

// Create singleton instance
const stateManager = new StateManager();

// Load persisted state on initialization
stateManager.loadPersistedState();

export default stateManager;
