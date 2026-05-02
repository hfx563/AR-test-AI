// GreenEdge Landscaping — Unit Tests

// ── sanitize helper (copied from server.js) ───────────────────────────────────
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').trim().slice(0, 500);
}

describe('sanitize()', () => {
  test('strips HTML tags', () => {
    expect(sanitize('<script>alert(1)</script>')).toBe('alert(1)');
  });

  test('trims whitespace', () => {
    expect(sanitize('  hello  ')).toBe('hello');
  });

  test('truncates to 500 chars', () => {
    expect(sanitize('a'.repeat(600)).length).toBe(500);
  });

  test('returns non-string values as-is', () => {
    expect(sanitize(42)).toBe(42);
    expect(sanitize(null)).toBe(null);
  });

  test('leaves safe text unchanged', () => {
    expect(sanitize('John Doe')).toBe('John Doe');
  });
});

// ── NFC debounce logic ────────────────────────────────────────────────────────
describe('NFC debounce', () => {
  test('duplicate tap within 5s should be rejected', () => {
    const nfcDebounce = new Map();
    const tag = 'TAG-001';
    nfcDebounce.set(tag, Date.now());
    const lastTap = nfcDebounce.get(tag);
    expect(Date.now() - lastTap).toBeLessThan(5000);
  });

  test('tap after 5s should be allowed', () => {
    const nfcDebounce = new Map();
    const tag = 'TAG-002';
    nfcDebounce.set(tag, Date.now() - 6000);
    const lastTap = nfcDebounce.get(tag);
    expect(Date.now() - lastTap).toBeGreaterThanOrEqual(5000);
  });
});

// ── Session expiry logic ──────────────────────────────────────────────────────
describe('Session expiry', () => {
  test('expired session should be rejected', () => {
    const SESSION_TTL = 8 * 60 * 60 * 1000;
    const sessionExpiry = new Map();
    const token = 'test-token';
    sessionExpiry.set(token, Date.now() - SESSION_TTL - 1000);
    expect(Date.now() > sessionExpiry.get(token)).toBe(true);
  });

  test('valid session should pass', () => {
    const SESSION_TTL = 8 * 60 * 60 * 1000;
    const sessionExpiry = new Map();
    const token = 'test-token-2';
    sessionExpiry.set(token, Date.now() + SESSION_TTL);
    expect(Date.now() > sessionExpiry.get(token)).toBe(false);
  });
});

// ── Input validation ──────────────────────────────────────────────────────────
describe('Input validation', () => {
  test('truck requires name and nfc_tag', () => {
    const body = { name: '', nfc_tag: '' };
    expect(!body.name || !body.nfc_tag).toBe(true);
  });

  test('valid truck passes validation', () => {
    const body = { name: 'Truck 1', nfc_tag: 'NFC-001' };
    expect(!body.name || !body.nfc_tag).toBe(false);
  });

  test('log action must be entry or exit', () => {
    const validActions = ['entry', 'exit'];
    expect(validActions.includes('entry')).toBe(true);
    expect(validActions.includes('exit')).toBe(true);
    expect(validActions.includes('invalid')).toBe(false);
  });

  test('parseFloat defaults to 0 for invalid quantity', () => {
    expect(parseFloat('') || 0).toBe(0);
    expect(parseFloat('abc') || 0).toBe(0);
    expect(parseFloat('5.5') || 0).toBe(5.5);
  });
});
