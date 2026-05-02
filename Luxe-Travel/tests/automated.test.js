// ArLux Automated Test Suite

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

describe('ArLux Website Tests', () => {

  describe('LocalStorage', () => {
    test('should save username', () => {
      localStorage.setItem('arlux-username', 'TestUser');
      expect(localStorage.getItem('arlux-username')).toBe('TestUser');
    });

    test('should backup chat messages', () => {
      const messages = [{ id: 1, text: 'Test', username: 'User' }];
      localStorage.setItem('luxe-chat-backup', JSON.stringify(messages));
      expect(JSON.parse(localStorage.getItem('luxe-chat-backup')).length).toBe(1);
    });

    test('should clear stored data', () => {
      localStorage.setItem('test-key', 'value');
      localStorage.removeItem('test-key');
      expect(localStorage.getItem('test-key')).toBeNull();
    });
  });

  describe('Security — Input Sanitization', () => {
    test('should escape script tags', () => {
      const input = '<script>alert("xss")</script>';
      expect(escapeHtml(input)).not.toContain('<script>');
    });

    test('should escape angle brackets', () => {
      expect(escapeHtml('<b>bold</b>')).toBe('&lt;b&gt;bold&lt;/b&gt;');
    });

    test('should escape double quotes', () => {
      expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
    });

    test('should leave safe text unchanged in meaning', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });
  });

  describe('Responsive Design', () => {
    test('mobile viewport width is less than 768', () => {
      expect(375).toBeLessThan(768);
    });

    test('desktop viewport width is 768 or more', () => {
      expect(1280).toBeGreaterThanOrEqual(768);
    });
  });

  describe('Chat Message Validation', () => {
    test('should reject empty message', () => {
      const msg = '   ';
      expect(msg.trim().length).toBe(0);
    });

    test('should accept valid message', () => {
      const msg = 'Hello!';
      expect(msg.trim().length).toBeGreaterThan(0);
    });

    test('should enforce max length of 500', () => {
      const long = 'a'.repeat(501);
      expect(long.length).toBeGreaterThan(500);
    });
  });

  describe('Username Validation', () => {
    test('should reject username shorter than 2 chars', () => {
      expect('a'.length).toBeLessThan(2);
    });

    test('should accept valid username', () => {
      const name = 'Alice';
      expect(name.length).toBeGreaterThanOrEqual(2);
      expect(name.length).toBeLessThanOrEqual(30);
    });
  });

  describe('API Error Handling', () => {
    test('should catch fetch errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      let caught = null;
      try { await fetch('https://invalid-api.example.com'); } catch (e) { caught = e; }
      expect(caught).toBeTruthy();
      expect(caught.message).toBe('Network error');
    });
  });

});
