"""
HP Workforce Experience Documentation - Website to PDF Converter
Uses Playwright to render JS-heavy Document360 site, then generates a structured PDF.
"""

import asyncio
import re
import sys
import time
from collections import OrderedDict
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup
from fpdf import FPDF
from playwright.async_api import async_playwright

BASE_URL = "https://learn.workforceexperience.hp.com/docs"
DOMAIN = "learn.workforceexperience.hp.com"
OUTPUT_PDF = "HP_WorkforceExperience_Docs.pdf"
DELAY = 1.5  # seconds between page loads

visited = OrderedDict()   # url -> {title, sections}


# ── Helpers ───────────────────────────────────────────────────────────────────

def clean(text):
    return re.sub(r'\s+', ' ', text or '').strip()

def normalize(url):
    p = urlparse(url)
    return p._replace(fragment='', query='').geturl().rstrip('/')

def is_doc_link(url):
    p = urlparse(url)
    return (p.netloc == DOMAIN or p.netloc == '') and '/docs' in p.path


# ── Content Extraction ────────────────────────────────────────────────────────

def extract_content(html, url):
    soup = BeautifulSoup(html, 'lxml')

    # Remove noise
    for tag in soup.select('nav, header, footer, script, style, '
                           '.navbar, .sidebar, .footer, .cookie-banner, '
                           '[class*="sidebar"], [class*="nav-"], '
                           '[class*="footer"], button, .breadcrumb'):
        tag.decompose()

    # Title
    title = ''
    h1 = soup.find('h1')
    if h1:
        title = clean(h1.get_text())
    elif soup.title:
        title = clean(soup.title.get_text()).replace(' - WXP KB', '').strip()

    # Main content
    main = (soup.find('main') or
            soup.find('article') or
            soup.find(class_=re.compile(r'article|content|markdown|docs-content', re.I)) or
            soup.body)

    sections = []
    if not main:
        return {'title': title, 'sections': sections}

    cur_heading, cur_level, cur_paras = title, 1, []

    def flush():
        text = ' '.join(cur_paras).strip()
        if cur_heading or text:
            sections.append({'heading': cur_heading, 'level': cur_level, 'text': text})

    for el in main.descendants:
        if not hasattr(el, 'name') or not el.name:
            continue
        if el.name in ('h1','h2','h3','h4','h5','h6'):
            flush()
            cur_paras = []
            cur_heading = clean(el.get_text())
            cur_level = int(el.name[1])
        elif el.name in ('p','li','td','th','pre','blockquote'):
            t = clean(el.get_text())
            if t and el.parent.name not in ('li',):
                cur_paras.append(t)

    flush()
    return {'title': title, 'sections': sections}


# ── Nav Link Extraction ───────────────────────────────────────────────────────

def extract_links(html, base):
    soup = BeautifulSoup(html, 'lxml')
    links = []
    seen = set()

    # Document360 sidebar selectors
    nav = (soup.find(class_=re.compile(r'sidebar|toc|nav-tree|category', re.I)) or
           soup.find('nav') or soup)

    for a in nav.find_all('a', href=True):
        href = a['href'].strip()
        if href.startswith('#') or href.startswith('mailto:'):
            continue
        full = normalize(urljoin(base, href))
        if is_doc_link(full) and full not in seen:
            seen.add(full)
            links.append(full)
    return links


# ── Crawler ───────────────────────────────────────────────────────────────────

async def crawl():
    print(f"Starting crawl: {BASE_URL}")
    print("Opening browser...")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                       'AppleWebKit/537.36 (KHTML, like Gecko) '
                       'Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1280, 'height': 900}
        )
        page = await context.new_page()

        queue = [normalize(BASE_URL)]
        queued = set(queue)

        while queue:
            url = queue.pop(0)
            if url in visited:
                continue

            print(f"  [{len(visited)+1}] {url}")
            try:
                await page.goto(url, wait_until='networkidle', timeout=30000)
                # Wait for Document360 content to render
                try:
                    await page.wait_for_selector(
                        'article, .article-content, main, h1',
                        timeout=10000
                    )
                except Exception:
                    pass
                await asyncio.sleep(DELAY)

                html = await page.content()
                content = extract_content(html, url)
                visited[url] = content

                # Discover new links
                new_links = extract_links(html, url)
                for link in new_links:
                    if link not in queued and link not in visited:
                        queued.add(link)
                        queue.append(link)

            except Exception as e:
                print(f"    [SKIP] {e}")
                visited[url] = {'title': url.split('/')[-1], 'sections': []}

        await browser.close()

    print(f"\nCrawled {len(visited)} pages.")


# ── PDF ───────────────────────────────────────────────────────────────────────

class DocPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=20)
        self.set_margins(20, 20, 20)

    def header(self):
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 8, 'HP Workforce Experience Documentation', align='C',
                  new_x='LMARGIN', new_y='NEXT')

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f'Page {self.page_no()}', align='C')

    def s(self, text):
        return (text or '').encode('latin-1', errors='replace').decode('latin-1')

    def cover(self):
        self.add_page()
        self.set_fill_color(0, 96, 160)
        self.rect(0, 0, 210, 297, 'F')
        self.set_text_color(255, 255, 255)
        self.set_y(90)
        self.set_font('Helvetica', 'B', 26)
        self.cell(0, 14, 'HP Workforce Experience', align='C', new_x='LMARGIN', new_y='NEXT')
        self.set_font('Helvetica', '', 18)
        self.cell(0, 12, 'Documentation', align='C', new_x='LMARGIN', new_y='NEXT')
        self.ln(10)
        self.set_font('Helvetica', 'I', 11)
        self.cell(0, 8, 'learn.workforceexperience.hp.com/docs', align='C',
                  new_x='LMARGIN', new_y='NEXT')
        self.ln(6)
        self.set_font('Helvetica', '', 10)
        self.cell(0, 8, f'Total sections: {len(visited)}', align='C',
                  new_x='LMARGIN', new_y='NEXT')
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
            if e['level'] == 1:
                self.set_font('Helvetica', 'B', 10)
            elif e['level'] == 2:
                self.set_font('Helvetica', '', 9)
            else:
                self.set_font('Helvetica', 'I', 8)

            title = self.s(e['title'][:75])
            pg = str(e['page'])
            avail = 165 - indent - self.get_string_width(pg)
            tw = self.get_string_width(title)
            dw = self.get_string_width('.')
            dots = '.' * max(0, int((avail - tw) / dw))
            self.cell(0, 6, f'{title} {dots} {pg}', new_x='LMARGIN', new_y='NEXT')

    def doc_page(self, url, data):
        self.add_page()
        self.set_text_color(0, 0, 0)

        # URL label
        self.set_font('Helvetica', 'I', 7)
        self.set_text_color(130, 130, 130)
        self.cell(0, 5, self.s(url), new_x='LMARGIN', new_y='NEXT')
        self.set_draw_color(210, 210, 210)
        self.line(20, self.get_y(), 190, self.get_y())
        self.ln(3)
        self.set_text_color(0, 0, 0)

        for sec in data['sections']:
            h = self.s(sec.get('heading', ''))
            t = self.s(sec.get('text', ''))
            lvl = sec.get('level', 1)

            if h:
                if lvl == 1:
                    self.set_font('Helvetica', 'B', 15)
                    self.set_text_color(0, 96, 160)
                    self.multi_cell(0, 9, h)
                    self.set_draw_color(0, 96, 160)
                    self.line(20, self.get_y(), 190, self.get_y())
                    self.ln(3)
                elif lvl == 2:
                    self.set_font('Helvetica', 'B', 12)
                    self.set_text_color(20, 20, 20)
                    self.multi_cell(0, 8, h)
                    self.ln(1)
                elif lvl == 3:
                    self.set_font('Helvetica', 'B', 10)
                    self.set_text_color(50, 50, 50)
                    self.multi_cell(0, 7, h)
                else:
                    self.set_font('Helvetica', 'BI', 9)
                    self.set_text_color(70, 70, 70)
                    self.multi_cell(0, 6, h)
                self.set_text_color(0, 0, 0)

            if t:
                self.set_font('Helvetica', '', 9)
                self.set_text_color(40, 40, 40)
                self.multi_cell(0, 5, t)
                self.ln(3)


def build_pdf():
    print("Building PDF...")

    # Pass 1: measure page numbers
    measure = DocPDF()
    measure.cover()
    measure.add_page()          # TOC placeholder
    toc_entries = []

    for url, data in visited.items():
        pg = measure.page + 1
        title = data.get('title') or url.split('/')[-1] or url
        depth = urlparse(url).path.rstrip('/').count('/') - 2
        toc_entries.append({'title': title, 'level': max(1, min(depth, 4)), 'page': pg})
        measure.doc_page(url, data)

    # Pass 2: real PDF with correct page numbers
    pdf = DocPDF()
    pdf.cover()
    pdf.toc(toc_entries)
    for url, data in visited.items():
        pdf.doc_page(url, data)

    pdf.output(OUTPUT_PDF)
    print(f"PDF saved: {OUTPUT_PDF}  ({pdf.page} pages)")


# ── Entry Point ───────────────────────────────────────────────────────────────

if __name__ == '__main__':
    asyncio.run(crawl())
    if not visited:
        print("No pages crawled. Check network or URL.")
        sys.exit(1)
    build_pdf()
