// E2E Tests with Playwright
import { test, expect } from '@playwright/test';

test.describe('Luxe Travel App', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8080');
    });
    
    test('should load homepage', async ({ page }) => {
        await expect(page).toHaveTitle(/Luxe Travel/);
        await expect(page.locator('.hero-title')).toContainText('Where will you go?');
    });
    
    test('should display IP address', async ({ page }) => {
        await page.waitForSelector('#ipAddress', { timeout: 5000 });
        const ipText = await page.locator('#ipAddress').textContent();
        expect(ipText).not.toBe('Loading your IP...');
    });
    
    test('should search for a city', async ({ page }) => {
        // Type in search box
        await page.fill('#cityInput', 'Paris');
        
        // Wait for autocomplete
        await page.waitForSelector('#autocompleteContainer ul', { timeout: 3000 });
        
        // Click first result
        await page.click('#autocompleteContainer li:first-child');
        
        // Click search button
        await page.click('#searchButton');
        
        // Wait for city info to appear
        await page.waitForSelector('#cityInfoSection', { state: 'visible', timeout: 5000 });
        
        // Verify city name is displayed
        const cityName = await page.locator('#cityName').textContent();
        expect(cityName).toContain('Paris');
    });
    
    test('should open and close chat modal', async ({ page }) => {
        // Open chat
        await page.click('#toggleChatBtn');
        
        // Handle username prompt
        page.on('dialog', async dialog => {
            await dialog.accept('TestUser');
        });
        
        // Wait for modal
        await page.waitForSelector('#chatModal', { state: 'visible' });
        
        // Verify modal is visible
        const modal = page.locator('#chatModal');
        await expect(modal).toBeVisible();
        
        // Close chat
        await page.click('#closeChatBtn');
        
        // Verify modal is hidden
        await expect(modal).toBeHidden();
    });
    
    test('should send a chat message', async ({ page }) => {
        // Open chat
        await page.click('#toggleChatBtn');
        
        // Handle username prompt
        page.once('dialog', async dialog => {
            await dialog.accept('TestUser');
        });
        
        await page.waitForSelector('#chatModal', { state: 'visible' });
        
        // Type message
        await page.fill('#chatInput', 'Hello from E2E test!');
        
        // Send message
        await page.click('#sendMessageBtn');
        
        // Wait for message to appear
        await page.waitForSelector('.chat-message', { timeout: 3000 });
        
        // Verify message is displayed
        const message = page.locator('.chat-message').last();
        await expect(message).toContainText('Hello from E2E test!');
    });
    
    test('should open world news modal', async ({ page }) => {
        // Click world news button
        await page.click('#worldNewsBtn');
        
        // Wait for modal
        await page.waitForSelector('#newsModal', { state: 'visible' });
        
        // Verify modal title
        const title = await page.locator('#newsModalTitle').textContent();
        expect(title).toBe('World News');
        
        // Wait for news to load
        await page.waitForSelector('.news-card', { timeout: 5000 });
        
        // Verify news cards are displayed
        const newsCards = await page.locator('.news-card').count();
        expect(newsCards).toBeGreaterThan(0);
    });
    
    test('should toggle background music', async ({ page }) => {
        const musicBtn = page.locator('#toggleMusicBtn');
        
        // Click to start music
        await musicBtn.click();
        
        // Verify button text changed
        await expect(musicBtn.locator('span')).toContainText('Pause Music');
        
        // Click to stop music
        await musicBtn.click();
        
        // Verify button text changed back
        await expect(musicBtn.locator('span')).toContainText('Play Music');
    });
    
    test('should be responsive on mobile', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        
        // Verify hero section is visible
        await expect(page.locator('.hero')).toBeVisible();
        
        // Verify search box is visible
        await expect(page.locator('.search-box')).toBeVisible();
        
        // Verify news buttons stack vertically
        const newsButtons = page.locator('.hero-news-buttons');
        const box = await newsButtons.boundingBox();
        expect(box.height).toBeGreaterThan(200); // Stacked buttons are taller
    });
    
    test('should handle network errors gracefully', async ({ page }) => {
        // Simulate offline
        await page.context().setOffline(true);
        
        // Try to search
        await page.fill('#cityInput', 'London');
        await page.click('#searchButton');
        
        // Should show error toast (if implemented)
        // await expect(page.locator('.toast-error')).toBeVisible();
        
        // Go back online
        await page.context().setOffline(false);
    });
});
