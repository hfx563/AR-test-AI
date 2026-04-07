# Website to PDF Converter

Crawls any documentation website and saves it as a structured PDF with images.

---

## First Time on a New PC

### Step 1 — Install Python
- Download from: https://www.python.org/downloads/
- During install, check **"Add Python to PATH"**

### Step 2 — Run Setup
- Double-click **`SETUP.bat`**
- It will install everything automatically (~200MB download for the browser)
- Takes 2-5 minutes on first run

### Step 3 — Run the Converter
- Double-click **`crawl_to_pdf.bat`**
- Paste the website URL when asked
- Enter the folder where you want to save the PDF, or press **ENTER** to save in the same folder as the script
- Complete any browser challenge if shown
- Press ENTER in the terminal when the page loads
- Wait for it to finish — PDF saved in your chosen location

---

## Already Set Up (Returning User)

Just double-click **`crawl_to_pdf.bat`** — it will ask for:
1. The website URL
2. Where to save the PDF (press ENTER to save in the script folder)

---

## Requirements

- Windows PC
- Python 3.8 or higher (free from python.org)
- Internet connection

---

## Output Files

| File | Description |
|------|-------------|
| `<domain>.pdf` | The generated PDF (saved in your chosen location) |
| `Scripts/<domain>.log` | Full log of the crawl |
| `Scripts/<domain>_cache.json` | Saved crawl data |
| `Scripts/img_cache/` | Downloaded images |

---

## Troubleshooting

**"Python is not installed"** — Install from python.org, check "Add to PATH"

**Bot detection / Cloudflare** — Complete the challenge manually in the browser window, then press ENTER

**Missing pages** — The site may load content dynamically. Try manually expanding the sidebar before pressing ENTER

**PDF build error** — Check `Scripts/<domain>.log` for details
