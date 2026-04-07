"""
Website to PDF Converter
- Single browser tab (avoids bot detection)
- Embeds images and diagrams into PDF
- Saves crawl progress every 25 pages
- Works on any documentation website
"""

import asyncio
import hashlib
import io
import json
import logging
import os
import re
import sys
from collections import OrderedDict
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from fpdf import FPDF
from PIL import Image, UnidentifiedImageError
from playwright.async_api import TimeoutError as PlaywrightTimeout
from playwright.async_api import async_playwright
from requests.exceptions import RequestException

# ── Runtime config (set by setup()) ──────────────────────────────────────────
# Config is stored in a single mutable object to avoid dangerous module-level globals
class _Config:
    delay      = 0.3
    base_url   = ""
    domain     = ""
    output_pdf = ""
    cache_file = ""
    img_dir    = ""
    log_file   = ""
    concurrent = 8

cfg     = _Config()
visited = OrderedDict()
log     = logging.getLogger(__name__)

# Module-level constants (immutable, not reassigned after import)
DELAY      = 0.3
CONCURRENT = 8


def setup(url, save_dir='.'):
    parsed        = urlparse(url)
    cfg.base_url  = url.rstrip('/')
    cfg.domain    = parsed.netloc

    # Sanitize domain — only word chars, dots, hyphens; strip edge chars
    safe = re.sub(r'[^\w.-]', '_', cfg.domain).strip('._')
    if not safe:
        raise ValueError(f"Invalid domain derived from URL: {url}")

    # Use a hash as the actual filename to completely avoid user input in paths
    file_key   = hashlib.sha256(safe.encode()).hexdigest()[:16]
    scripts_dir = os.path.realpath("Scripts")
    real_save   = os.path.realpath(save_dir)

    # All filenames are derived from a hash — no user input reaches os.path.join
    cfg.output_pdf = os.path.join(real_save,    file_key + ".pdf")
    cfg.cache_file = os.path.join(scripts_dir,  file_key + "_cache.json")
    cfg.img_dir    = os.path.join(scripts_dir,  "img_cache")
    cfg.log_file   = os.path.join(scripts_dir,  file_key + ".log")

    # Boundary checks
    if not os.path.realpath(cfg.output_pdf).startswith(real_save + os.sep):
        raise ValueError("Unsafe output path detected")
    if not os.path.realpath(cfg.cache_file).startswith(scripts_dir + os.sep):
        raise ValueError("Unsafe cache path detected")

    os.makedirs(cfg.img_dir, exist_ok=True)
    os.makedirs(scripts_dir, exist_ok=True)

    # Clear any existing handlers before adding new ones
    root = logging.getLogger()
    root.handlers.clear()
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        handlers=[
            logging.FileHandler(cfg.log_file, encoding="utf-8"),
            logging.StreamHandler(sys.stdout),
        ],
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

def clean(text):
    return re.sub(r'\s+', ' ', text or '').strip()

def normalize(url):
    p = urlparse(url)
    return p._replace(fragment='', query='').geturl().rstrip('/')

def is_doc_link(url):
    p = urlparse(url)
    return p.netloc == cfg.domain or p.netloc == ''

def save_cache():
    with open(cfg.cache_file, 'w', encoding='utf-8') as f:
        json.dump(dict(visited), f, ensure_ascii=False, indent=2)


# ── Image download ────────────────────────────────────────────────────────────

def safe_img_path(src):
    name     = hashlib.sha256(src.encode()).hexdigest()[:32] + '.jpg'
    real_dir = os.path.realpath(cfg.img_dir)
    path     = os.path.realpath(os.path.join(real_dir, name))
    if not path.startswith(real_dir):
        raise ValueError(f"Unsafe image path: {path}")
    return path

def save_image_bytes(src, data):
    """Save raw image bytes to disk, return path or None."""
    if not data:
        return None
    try:
        path = safe_img_path(src)
        if os.path.exists(path):
            return path
        # Use context manager to ensure BytesIO is always closed
        with io.BytesIO(data) as buf:
            img = Image.open(buf).convert('RGB')
            img.thumbnail((800, 600), Image.LANCZOS)
            img.save(path, 'JPEG', quality=75)
        return path
    except UnidentifiedImageError as e:
        log.warning("Image format unrecognised [%s]: %s", src[:80], e)
    except (OSError, ValueError) as e:
        log.warning("Image error [%s]: %s", src[:80], e)
    return None

def download_image(src):
    """Fallback: download image via requests (for non-expired URLs)."""
    if src.startswith('data:') or src.lower().endswith('.svg') or 'svg' in src.lower():
        return None
    try:
        path = safe_img_path(src)
        if os.path.exists(path):
            return path
        r = requests.get(src, headers={'User-Agent': 'Mozilla/5.0'}, timeout=10)
        r.raise_for_status()
        return save_image_bytes(src, r.content)
    except RequestException as e:
        log.warning("Image download failed [%s]: %s", src[:80], e)
    except (OSError, ValueError) as e:
        log.warning("Image error [%s]: %s", src[:80], e)
    return None

async def download_image_via_browser(page, src):
    """Download image using the browser session (handles signed/auth URLs)."""
    if src.startswith('data:') or src.lower().endswith('.svg') or 'svg' in src.lower():
        return None
    try:
        path = safe_img_path(src)
        if os.path.exists(path):
            return path
        # Use browser's fetch with same cookies/headers
        data = await page.evaluate("""
            async (url) => {
                try {
                    const r = await fetch(url);
                    if (!r.ok) return null;
                    const buf = await r.arrayBuffer();
                    return Array.from(new Uint8Array(buf));
                } catch(e) { return null; }
            }
        """, src)
        if data:
            return save_image_bytes(src, bytes(data))
    except PlaywrightTimeout as e:
        log.warning("Browser image fetch timeout [%s]: %s", src[:80], e)
    except (OSError, ValueError) as e:
        log.warning("Browser image fetch error [%s]: %s", src[:80], e)
    return None


# ── Extract links ─────────────────────────────────────────────────────────────

def extract_links(html, base):
    soup = BeautifulSoup(html, 'lxml')
    links, seen = [], set()
    for a in soup.find_all('a', href=True):
        href = a['href'].strip()
        if not href or href.startswith(('#', 'mailto:', 'javascript:')):
            continue
        full = normalize(urljoin(base, href))
        if is_doc_link(full) and full not in seen:
            seen.add(full)
            links.append(full)
    return links


# ── Extract content ───────────────────────────────────────────────────────────

def extract_content(html, base_url):
    soup = BeautifulSoup(html, 'lxml')

    # Remove UI chrome — keep only content
    for tag in soup.select(
        'nav, header, footer, script, style, button, '
        '[class*="sidebar"], [class*="nav-"], [class*="footer"], '
        '[class*="cookie"], [class*="breadcrumb"], [class*="search"], '
        '[class*="toc"], [class*="menu"], [role="navigation"], '
        '[class*="headerlink"], [class*="sphinx"], .headerlink'
    ):
        tag.decompose()

    # Title — strip anchor/permalink symbols
    title = ''
    h1 = soup.find('h1')
    if h1:
        title = re.sub(r'[\u00b6\u00a7\u2190-\u21ff\u2600-\u26ff]', '', clean(h1.get_text()))
    elif soup.title:
        title = clean(soup.title.get_text())

    # Main content area
    main = (
        soup.find('main') or
        soup.find('article') or
        soup.find(class_=re.compile(r'article|content|markdown|docs|post-body', re.I)) or
        soup.body
    )

    items = []
    cur_heading = title
    cur_level   = 1
    cur_paras   = []
    seen_text   = set()  # deduplicate repeated nav text

    def flush():
        text = ' '.join(cur_paras).strip()
        if cur_heading or text:
            items.append({
                'type':    'section',
                'heading': cur_heading,
                'level':   cur_level,
                'text':    text,
            })

    if main:
        for el in main.descendants:
            if not hasattr(el, 'name') or not el.name:
                continue

            if el.name in ('h1', 'h2', 'h3', 'h4', 'h5', 'h6'):
                flush()
                cur_paras   = []
                # Strip permalink/anchor symbols from headings
                cur_heading = re.sub(r'[\u00b6\u00a7\u2190-\u21ff\u2600-\u26ff#]', '',
                                     clean(el.get_text())).strip()
                cur_level   = int(el.name[1])

            elif el.name == 'img':
                # Flush pending text before inserting image
                flush()
                cur_paras   = []
                cur_heading = ''
                # Support lazy-loaded images (data-src, data-lazy-src, srcset)
                src = (
                    el.get('src') or
                    el.get('data-src') or
                    el.get('data-lazy-src') or
                    (el.get('srcset', '').split()[0] if el.get('srcset') else '')
                )
                if src and not src.startswith('data:'):
                    full_src = urljoin(base_url, src)
                    alt = clean(el.get('alt', ''))
                    items.append({'type': 'image', 'src': full_src, 'alt': alt})

            elif el.name in ('p', 'li', 'td', 'th', 'pre', 'blockquote', 'dd', 'dt'):
                # Skip if direct parent is also a block (avoid double-counting)
                if el.parent and el.parent.name in ('li', 'ul', 'ol'):
                    continue
                t = clean(el.get_text())
                # Chunk large text blocks to avoid multi_cell space errors
                if len(t) > 1000:
                    t = t[:1000] + '...'
                if t and t not in seen_text:
                    seen_text.add(t)
                    cur_paras.append(t)

            elif el.name in ('dt',):
                # Function/method definitions (used in Python docs style)
                flush()
                cur_paras   = []
                cur_heading = re.sub(r'[\u00b6\u00a7\u2190-\u21ff\u2600-\u26ff#]', '',
                                     clean(el.get_text())).strip()
                cur_level   = 3

        flush()

    return {'title': title, 'items': items}


# ── Fetch one page ────────────────────────────────────────────────────────────

async def fetch_one(tab, url):
    try:
        await tab.goto(url, wait_until='commit', timeout=20000)
        try:
            await tab.wait_for_selector('h1, article, main, .content', timeout=4000)
        except PlaywrightTimeout:
            pass  # continue anyway

        await asyncio.sleep(DELAY)

        # Quick scroll to trigger lazy-loaded images
        await tab.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await asyncio.sleep(0.2)

        html    = await tab.content()
        content = extract_content(html, url)
        links   = extract_links(html, url)

        # Download images NOW while session/signed URLs are still valid
        img_items = [item for item in content.get('items', []) if item['type'] == 'image' and item.get('src')]
        if img_items:
            paths = await asyncio.gather(*[download_image_via_browser(tab, item['src']) for item in img_items])
            for item, path in zip(img_items, paths):
                item['local_path'] = path

        return content, links

    except PlaywrightTimeout as e:
        log.error("Timeout fetching %s: %s", url, e)
        return {'title': url.split('/')[-1], 'items': []}, []
    except Exception as e:  # noqa: BLE001
        log.error("Error fetching %s: %s", url, e)
        return {'title': url.split('/')[-1], 'items': []}, []


# ── Crawl ─────────────────────────────────────────────────────────────────────

async def crawl():
    log.info("=" * 60)
    log.info("  Website to PDF Crawler  |  %s", cfg.base_url)
    log.info("=" * 60)
    print()
    print("Browser will open. Complete any challenge if shown,")
    print("then press ENTER in this terminal when the page loads.")
    print()

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            args=['--start-maximized', '--disable-blink-features=AutomationControlled']
        )
        context = await browser.new_context(
            user_agent=(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                'AppleWebKit/537.36 (KHTML, like Gecko) '
                'Chrome/124.0.0.0 Safari/537.36'
            ),
            viewport={'width': 1366, 'height': 768},
            locale='en-US',
            timezone_id='America/New_York',
        )
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
            Object.defineProperty(navigator, 'plugins',   {get: () => [1, 2, 3]});
            Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']});
            window.chrome = {runtime: {}};
        """)

        tab = await context.new_page()
        await tab.goto(cfg.base_url, wait_until='domcontentloaded', timeout=30000)

        input(">>> Page loaded? Press ENTER to start crawling: ")
        print()

        # Expand all sidebar toggles until no new links appear
        log.info("Expanding sidebar navigation...")
        prev_count = 0
        for attempt in range(5):  # reduced from 10
            try:
                await tab.evaluate("""
                    () => {
                        const selectors = [
                            '[class*="collapse"]', '[class*="expand"]',
                            '[class*="toggle"]',   '[class*="arrow"]',
                            '[class*="chevron"]',  '[class*="caret"]',
                            '[class*="category"]', '[class*="group"]',
                            '[class*="tree"]',     '[aria-expanded="false"]'
                        ];
                        selectors.forEach(sel => {
                            document.querySelectorAll(sel).forEach(el => {
                                try { el.click(); } catch(e) {}
                            });
                        });
                    }
                """)
            except Exception as e:  # noqa: BLE001
                log.warning("Sidebar expand error (ignored): %s", e)
            await asyncio.sleep(1.0)
            html  = await tab.content()
            count = len(extract_links(html, cfg.base_url))
            if count == prev_count:
                break
            prev_count = count
            log.info("  Sidebar pass %d: %d links found", attempt + 1, count)

        html       = await tab.content()
        seed_links = extract_links(html, cfg.base_url)
        queue      = [normalize(cfg.base_url)] + [l for l in seed_links if l != normalize(cfg.base_url)]
        queued     = set(queue)
        log.info("Starting crawl — %d links in queue\n", len(queue))

        # Open worker tabs
        tabs = [tab] + [await context.new_page() for _ in range(cfg.concurrent - 1)]

        idx = 0
        while idx < len(queue):
            # Build next batch
            batch = []
            while len(batch) < CONCURRENT and idx < len(queue):
                url = queue[idx]; idx += 1
                if url not in visited:
                    batch.append(url)

            if not batch:
                continue

            results = await asyncio.gather(
                *[fetch_one(tabs[i % cfg.concurrent], batch[i]) for i in range(len(batch))]
            )

            for url, (content, new_links) in zip(batch, results):
                visited[url] = content
                for link in new_links:
                    if link not in queued:
                        queued.add(link)
                        queue.append(link)

            log.info("  [%d/%d] batch done", len(visited), len(queue))

            if len(visited) % 25 == 0:
                save_cache()
                log.info("    [checkpoint: %d pages saved]", len(visited))

        log.info("Crawl complete — %d pages total", len(visited))
        save_cache()
        log.info("Cache: %s", cfg.cache_file)
        await browser.close()


# ── PDF ───────────────────────────────────────────────────────────────────────

class DocPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=20)
        self.set_margins(20, 20, 20)

    def header(self):
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(150, 150, 150)
        # Use dynamic domain, not hardcoded text
        self.cell(0, 8, self.s(cfg.domain), align='C', new_x='LMARGIN', new_y='NEXT')

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f'Page {self.page_no()}', align='C')

    def s(self, text):
        """Safe ASCII-only string for fpdf2 rendering."""
        # Remove non-ASCII
        t = re.sub(r'[^\x00-\x7F]', ' ', text or '')
        # Replace newlines/tabs with space
        t = re.sub(r'[\r\n\t]', ' ', t)
        # Strip control characters
        t = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', t)
        # Collapse multiple spaces
        return re.sub(r' {2,}', ' ', t).strip()

    def mc(self, w, h, txt):
        """Safe multi_cell — resets cursor, breaks long tokens, falls back on error."""
        txt = re.sub(r'(\S{80})', r'\1 ', self.s(txt).strip())
        if not txt:
            return
        h = max(h, 5)
        # Always reset X to left margin before rendering
        self.set_x(self.l_margin)
        try:
            self.multi_cell(w, h, txt)
        except Exception as e:  # noqa: BLE001
            log.warning("multi_cell failed (%s), truncating", e)
            self.set_x(self.l_margin)
            try:
                self.multi_cell(w, h, txt[:200])
            except Exception as e2:
                log.error("multi_cell fallback failed: %s", e2)

    def cover(self):
        self.add_page()
        self.set_fill_color(0, 96, 160)
        self.rect(0, 0, 210, 297, 'F')
        self.set_text_color(255, 255, 255)
        self.set_y(90)
        self.set_font('Helvetica', 'B', 22)
        self.mc(0, 12, cfg.domain)
        self.set_font('Helvetica', '', 16)
        self.cell(0, 10, 'Documentation', align='C', new_x='LMARGIN', new_y='NEXT')
        self.ln(8)
        self.set_font('Helvetica', 'I', 10)
        self.mc(0, 7, cfg.base_url)
        self.ln(5)
        self.set_font('Helvetica', '', 10)
        self.cell(0, 8, f'Total pages: {len(visited)}', align='C', new_x='LMARGIN', new_y='NEXT')
        self.set_text_color(0, 0, 0)

    def toc(self, entries):
        self.add_page()
        self.set_text_color(0, 0, 0)
        self.set_font('Helvetica', 'B', 18)
        self.cell(0, 12, 'Table of Contents', new_x='LMARGIN', new_y='NEXT')
        self.ln(2)
        self.set_draw_color(0, 96, 160)
        self.line(20, self.get_y(), 190, self.get_y())
        self.ln(5)
        for e in entries:
            indent = (e['level'] - 1) * 5
            self.set_x(20 + indent)
            self.set_font(
                'Helvetica',
                'B' if e['level'] == 1 else ('I' if e['level'] > 2 else ''),
                10 if e['level'] == 1 else (9 if e['level'] == 2 else 8)
            )
            title = self.s(e['title'][:75])
            pg    = str(e['page'])
            avail = 165 - indent - self.get_string_width(pg)
            dw    = self.get_string_width('.')
            dot_count = max(0, int((avail - self.get_string_width(title)) / max(dw, 0.1)))
            toc_line  = ' '.join([title, '.' * dot_count, pg])
            self.cell(0, 6, toc_line, new_x='LMARGIN', new_y='NEXT')

    def doc_page(self, url, data):
        self.add_page()
        # URL breadcrumb
        self.set_font('Helvetica', 'I', 7)
        self.set_text_color(130, 130, 130)
        self.cell(0, 5, self.s(url), new_x='LMARGIN', new_y='NEXT')
        self.set_draw_color(210, 210, 210)
        self.line(20, self.get_y(), 190, self.get_y())
        self.ln(3)

        sizes  = {1: 15, 2: 12, 3: 10, 4: 9}
        styles = {1: 'B', 2: 'B', 3: 'B', 4: 'BI'}
        colors = {1: (0, 96, 160), 2: (20, 20, 20), 3: (50, 50, 50), 4: (70, 70, 70)}

        for item in data.get('items', []):

            if item['type'] == 'section':
                h   = self.s(item.get('heading', ''))
                t   = self.s(item.get('text', ''))
                lvl = item.get('level', 1)
                if h:
                    self.set_font('Helvetica', styles.get(lvl, 'B'), sizes.get(lvl, 9))
                    self.set_text_color(*colors.get(lvl, (0, 0, 0)))
                    self.mc(0, max(sizes.get(lvl, 9) * 0.65, 5), h)
                    if lvl == 1:
                        self.set_draw_color(0, 96, 160)
                        self.line(20, self.get_y(), 190, self.get_y())
                    self.ln(2)
                    self.set_text_color(0, 0, 0)
                if t:
                    self.set_font('Helvetica', '', 9)
                    self.set_text_color(40, 40, 40)
                    self.mc(0, 5, t)
                    self.ln(3)

            elif item['type'] == 'image':
                src      = item.get('src', '')
                alt      = self.s(item.get('alt', ''))
                # Use pre-downloaded path if available, else try fallback download
                img_path = item.get('local_path') or download_image(src)
                if not src:
                    continue
                if img_path:
                    try:
                        with Image.open(img_path) as im:
                            iw, ih = im.size
                        max_w, max_h = 170, 110
                        ratio = min(max_w / max(iw, 1), max_h / max(ih, 1), 1.0)
                        w_mm  = min(iw * ratio * 0.264583, max_w)
                        h_mm  = min(ih * ratio * 0.264583, max_h)
                        if self.get_y() + h_mm > 265:
                            self.add_page()
                        self.image(img_path, x=20, w=w_mm, h=h_mm)
                        self.ln(2)
                        if alt:
                            self.set_font('Helvetica', 'I', 7)
                            self.set_text_color(120, 120, 120)
                            self.mc(0, 4, alt)
                            self.set_text_color(0, 0, 0)
                        self.ln(3)
                    except (OSError, ValueError) as e:
                        log.error("Image embed error [%s]: %s", img_path, e)
                elif alt:
                    self.set_font('Helvetica', 'I', 8)
                    self.set_text_color(120, 120, 120)
                    self.mc(0, 5, f'[Image: {alt}]')
                    self.set_text_color(0, 0, 0)
                    self.ln(2)


def build_pdf():
    log.info("Building PDF...")

    # Pass 1: dry-run to get accurate page numbers for TOC
    m = DocPDF()
    m.cover()
    m.add_page()  # TOC placeholder
    toc_entries = []
    for url, data in visited.items():
        pg    = m.page + 1
        title = data.get('title') or url.split('/')[-1] or url
        depth = urlparse(url).path.rstrip('/').count('/') - 1
        toc_entries.append({
            'title': title,
            'level': max(1, min(depth, 4)),
            'page':  pg,
        })
        m.doc_page(url, data)

    # Pass 2: real PDF with correct TOC page numbers
    pdf = DocPDF()
    pdf.cover()
    pdf.toc(toc_entries)
    for url, data in visited.items():
        pdf.doc_page(url, data)

    pdf.output(cfg.output_pdf)
    log.info("PDF saved: %s  (%d pages)", cfg.output_pdf, pdf.page)


# ── Entry Point ───────────────────────────────────────────────────────────────

if __name__ == '__main__':
    print()
    print("=" * 60)
    print("  Website to PDF Converter")
    print("=" * 60)
    print()

    while True:
        raw = input("Enter the website URL to crawl: ").strip()
        if not raw:
            print("  URL cannot be empty. Try again.")
            continue
        if not raw.startswith(('http://', 'https://')):
            raw = 'https://' + raw
        if not urlparse(raw).netloc:
            print("  Invalid URL. Example: https://docs.example.com")
            continue
        break

    # Ask for save location
    print()
    default_dir = os.path.abspath('.')
    save_dir = input(f"Enter folder to save PDF (press ENTER to save in same folder as script):\n  [{default_dir}]: ").strip()
    if not save_dir:
        save_dir = default_dir
    if not os.path.isdir(save_dir):
        try:
            os.makedirs(save_dir, exist_ok=True)
            print(f"  Created folder: {save_dir}")
        except OSError as e:
            print(f"  Could not create folder: {e}. Using current folder.")
            save_dir = default_dir

    setup(raw, save_dir)

    # Check if cache exists and offer to skip re-crawl
    if os.path.exists(cfg.cache_file):
        print()
        print(f"  Found existing crawl cache: {cfg.cache_file}")
        choice = input("  Re-crawl site or rebuild PDF from cache? [C=crawl / R=rebuild PDF]: ").strip().upper()
        if choice == 'R':
            with open(cfg.cache_file, 'r', encoding='utf-8') as f:
                visited.update(json.load(f))
            log.info("Loaded %d pages from cache. Skipping crawl.", len(visited))
            build_pdf()
            sys.exit(0)

    log.info("URL:    %s", cfg.base_url)
    log.info("Output: %s", cfg.output_pdf)
    log.info("Log:    %s", cfg.log_file)
    print()

    asyncio.run(crawl())
    if not visited:
        log.error("No pages were crawled. Exiting.")
        sys.exit(1)
    build_pdf()
