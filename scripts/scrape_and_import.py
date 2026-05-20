#!/usr/bin/env python3
"""
ListmyAI — Direct Page Scraper (no sitemaps)
Scrapes competitor directory listing pages directly to extract tool data.

Install:  pip install requests beautifulsoup4
Usage:    python3 scripts/scrape_and_import.py
          python3 scripts/scrape_and_import.py futurepedia   # one source
"""

import requests
import json
import time
import re
import sys
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup

# ── CONFIG ────────────────────────────────────────────────────────────────────
IMPORT_URL    = "https://www.listmyai.com/api/tools/import-batch"
IMPORT_SECRET = "listmyai_import_2026"
LIMIT         = 300   # max tools per source
BATCH_SIZE    = 50
DELAY         = 0.5   # seconds between requests

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
}

# ── CATEGORY GUESSER ──────────────────────────────────────────────────────────
CATEGORY_RULES = [
    (r"image|photo|art|dall|midjourney|stable.diff|flux|firefly",  "Image Generation"),
    (r"video|film|animation|clip|sora|runway",                      "Video Generation"),
    (r"audio|music|sound|voice|speech|tts|podcast|eleven",          "Audio & Music"),
    (r"code|program|developer|github|debug|cursor|copilot",         "Code Assistant"),
    (r"seo|marketing|ads|campaign|brand|social",                    "SEO & Marketing"),
    (r"write|writing|copy|blog|essay|content|jasper",               "Writing & Copy"),
    (r"data|analytic|chart|spreadsheet|sql|bi\b",                   "Data & Analytics"),
    (r"search|research|knowledge|perplexity",                       "Research"),
    (r"automat|workflow|integrat|zapier|make\b|n8n",                "Automation"),
    (r"education|learn|study|tutor|quiz|course",                    "Education"),
    (r"health|medical|fitness|mental",                              "Healthcare"),
    (r"finance|legal|law|contract|accounting",                      "Finance & Legal"),
    (r"design|ui|ux|figma|canva|logo",                              "Design & Creative"),
    (r"chat|assistant|bot|gpt|claude|gemini|llm",                   "Chatbot / Assistant"),
]

def guess_category(text):
    t = (text or "").lower()
    for pattern, cat in CATEGORY_RULES:
        if re.search(pattern, t):
            return cat
    return "Other"

# ── HELPERS ───────────────────────────────────────────────────────────────────
def fetch(url, timeout=12):
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout)
        r.raise_for_status()
        return r.text
    except Exception as e:
        print(f"    ⚠  {e}")
        return None

def og(soup, prop):
    tag = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop})
    return (tag.get("content") or "").strip() if tag else ""

def clean_name(name):
    """Strip site suffixes like '— Futurepedia' or '| AI Tools'"""
    name = re.sub(r"\s*[-|–—|·]\s*(futurepedia|futuretools|toolify|aitoptools|there.s an ai|ai tools directory).*$",
                  "", name, flags=re.IGNORECASE)
    return name.strip()

def name_from_slug(url):
    path = urlparse(url).path
    parts = [p for p in path.split("/") if p]
    return parts[-1].replace("-", " ").title() if parts else ""

def external_link(soup, page_host):
    """Find the 'Visit tool' / external link on a listing page."""
    skip = {"google.com", "twitter.com", "x.com", "facebook.com",
            "instagram.com", "linkedin.com", "youtube.com", "tiktok.com",
            page_host}
    # Prefer links with tell-tale text or classes
    for a in soup.find_all("a", href=True):
        href = a.get("href", "")
        if not href.startswith("http"):
            continue
        try:
            h = urlparse(href).hostname or ""
            if not any(s in h for s in skip):
                text = (a.get_text() or "").lower()
                cls  = " ".join(a.get("class") or []).lower()
                if any(w in text + cls for w in ["visit", "go to", "open", "launch", "try", "website", "site"]):
                    return href.rstrip("/")
        except:
            pass
    # Fallback: first external link
    for a in soup.find_all("a", href=True):
        href = a.get("href", "")
        if href.startswith("http"):
            try:
                h = urlparse(href).hostname or ""
                if not any(s in h for s in skip):
                    return href.rstrip("/")
            except:
                pass
    return None

def import_batch(tools):
    if not tools:
        return {}
    try:
        r = requests.post(
            IMPORT_URL,
            json={"tools": tools, "secret": IMPORT_SECRET},
            headers={"Content-Type": "application/json"},
            timeout=30,
        )
        return r.json()
    except Exception as e:
        return {"error": str(e)}

def flush(tools, label=""):
    if not tools:
        return 0
    print(f"\n  📤  Sending {len(tools)} tools to ListmyAI{' (' + label + ')' if label else ''}…")
    result = import_batch(tools)
    imported = result.get("imported", 0)
    skipped  = result.get("skipped", 0)
    errors   = result.get("errors", [])
    print(f"  → imported: {imported}  skipped: {skipped}" +
          (f"  errors: {errors[:2]}" if errors else ""))
    return imported

# ═══════════════════════════════════════════════════════════════════════════════
# SOURCE SCRAPERS  —  each returns a list of tool dicts
# ═══════════════════════════════════════════════════════════════════════════════

def scrape_futurepedia(limit=LIMIT):
    """Futurepedia — paginated card grid at /ai-tools?page=N"""
    base = "https://www.futurepedia.io"
    tools = []
    page  = 1
    while len(tools) < limit:
        url  = f"{base}/ai-tools?page={page}"
        html = fetch(url)
        if not html:
            break
        soup = BeautifulSoup(html, "html.parser")

        # Tool cards: <a href="/tool/xxx"> containing a heading
        cards = soup.find_all("a", href=re.compile(r"^/tool/"))
        if not cards:
            break

        for card in cards:
            if len(tools) >= limit:
                break
            href = card.get("href", "")
            full = urljoin(base, href)

            # Extract from card itself (avoid full page fetch)
            name_el = card.find(["h2","h3","h4","strong","span"], class_=re.compile(r"name|title|heading", re.I))
            name    = (name_el.get_text(strip=True) if name_el else "") or name_from_slug(full)
            desc_el = card.find(["p","span"], class_=re.compile(r"desc|summary|tagline|sub", re.I))
            desc    = desc_el.get_text(strip=True) if desc_el else ""

            if not name:
                continue

            tools.append({
                "name":        clean_name(name),
                "tagline":     desc[:120] or name,
                "description": desc[:500],
                "website":     full,   # listing URL as fallback; import-batch dedupes by website
                "category":    guess_category(name + " " + desc),
            })

        print(f"  📄  Page {page}: {len(cards)} cards — total so far: {len(tools)}")
        page += 1
        time.sleep(DELAY)

    return tools


def scrape_futuretools(limit=LIMIT):
    """FutureTools — paginated at /tools?page=N"""
    base  = "https://www.futuretools.io"
    tools = []
    page  = 1
    while len(tools) < limit:
        url  = f"{base}/tools?page={page}"
        html = fetch(url)
        if not html:
            break
        soup = BeautifulSoup(html, "html.parser")

        cards = soup.find_all("a", href=re.compile(r"^/tools/"))
        if not cards:
            break

        for card in cards:
            if len(tools) >= limit:
                break
            href = card.get("href", "")
            full = urljoin(base, href)
            name_el = card.find(["h2","h3","h4","strong"])
            name    = (name_el.get_text(strip=True) if name_el else "") or name_from_slug(full)
            desc_el = card.find("p")
            desc    = desc_el.get_text(strip=True) if desc_el else ""

            if not name:
                continue
            tools.append({
                "name":        clean_name(name),
                "tagline":     desc[:120] or name,
                "description": desc[:500],
                "website":     full,
                "category":    guess_category(name + " " + desc),
            })

        print(f"  📄  Page {page}: {len(cards)} cards — total so far: {len(tools)}")
        page += 1
        time.sleep(DELAY)

    return tools


def scrape_toolify(limit=LIMIT):
    """Toolify.ai — category pages + pagination"""
    base = "https://www.toolify.ai"
    # Their main nav categories
    categories = [
        "/ai-tools/",
        "/category/ai-writing-assistant-tools",
        "/category/ai-image-generator-tools",
        "/category/ai-video-generator-tools",
        "/category/ai-code-assistant-tools",
        "/category/ai-chatbot-tools",
    ]
    tools = []
    seen  = set()

    for cat_path in categories:
        if len(tools) >= limit:
            break
        for page in range(1, 6):  # up to 5 pages per category
            if len(tools) >= limit:
                break
            url  = f"{base}{cat_path}?page={page}" if page > 1 else f"{base}{cat_path}"
            html = fetch(url)
            if not html:
                break
            soup = BeautifulSoup(html, "html.parser")

            cards = soup.find_all("a", href=re.compile(r"/(en/)?tool/"))
            if not cards:
                break

            added = 0
            for card in cards:
                if len(tools) >= limit:
                    break
                href = card.get("href", "")
                if not href.startswith("http"):
                    href = urljoin(base, href)
                if href in seen:
                    continue
                seen.add(href)

                name_el = card.find(["h2","h3","h4","strong","div"],
                                    class_=re.compile(r"name|title|tool", re.I))
                name    = (name_el.get_text(strip=True) if name_el else "") or name_from_slug(href)
                desc_el = card.find("p")
                desc    = desc_el.get_text(strip=True) if desc_el else ""

                if not name or len(name) > 80:
                    continue
                tools.append({
                    "name":        clean_name(name),
                    "tagline":     desc[:120] or name,
                    "description": desc[:500],
                    "website":     href,
                    "category":    guess_category(name + " " + desc),
                })
                added += 1

            print(f"  📄  {cat_path} p{page}: +{added} — total: {len(tools)}")
            time.sleep(DELAY)

    return tools


def scrape_aitoptools(limit=LIMIT):
    """AI Top Tools — paginated grid"""
    base  = "https://aitoptools.com"
    tools = []
    page  = 1
    while len(tools) < limit:
        url  = f"{base}/tools/?paged={page}" if page > 1 else f"{base}/tools/"
        html = fetch(url)
        if not html:
            break
        soup = BeautifulSoup(html, "html.parser")

        cards = soup.find_all("a", href=re.compile(r"/tools?/[^/]+/?$"))
        if not cards:
            # Try alternate structure
            cards = soup.select("article a, .tool-card a, .card a")
        if not cards:
            break

        prev_count = len(tools)
        for card in cards:
            if len(tools) >= limit:
                break
            href = card.get("href", "")
            if not href.startswith("http"):
                href = urljoin(base, href)

            name_el = card.find(["h2","h3","h4","strong"])
            name    = (name_el.get_text(strip=True) if name_el else "") or name_from_slug(href)
            desc_el = card.find("p")
            desc    = desc_el.get_text(strip=True) if desc_el else ""

            if not name or len(name) > 100:
                continue
            tools.append({
                "name":        clean_name(name),
                "tagline":     desc[:120] or name,
                "description": desc[:500],
                "website":     href,
                "category":    guess_category(name + " " + desc),
            })

        if len(tools) == prev_count:
            break  # no new tools found

        print(f"  📄  Page {page}: total so far: {len(tools)}")
        page += 1
        time.sleep(DELAY)

    return tools


def scrape_taaft(limit=LIMIT):
    """There's An AI For That — listing pages"""
    base  = "https://theresanaiforthat.com"
    tools = []
    # They use /ais/?sort=...&page=N
    page  = 1
    while len(tools) < limit:
        url  = f"{base}/ais/?sort=most_saved&page={page}"
        html = fetch(url)
        if not html:
            break
        soup = BeautifulSoup(html, "html.parser")

        cards = soup.find_all("a", href=re.compile(r"^/ai/[^/]+/?$"))
        if not cards:
            break

        for card in cards:
            if len(tools) >= limit:
                break
            href = card.get("href", "")
            full = urljoin(base, href)
            name_el = card.find(["h2","h3","h4","strong","span"])
            name    = (name_el.get_text(strip=True) if name_el else "") or name_from_slug(full)
            desc_el = card.find("p")
            desc    = desc_el.get_text(strip=True) if desc_el else ""

            if not name:
                continue
            tools.append({
                "name":        clean_name(name),
                "tagline":     desc[:120] or name,
                "description": desc[:500],
                "website":     full,
                "category":    guess_category(name + " " + desc),
            })

        print(f"  📄  Page {page}: {len(cards)} cards — total: {len(tools)}")
        page += 1
        time.sleep(DELAY)

    return tools


def scrape_aitoolsdirectory(limit=LIMIT):
    """AI Tools Directory — paginated listing"""
    base  = "https://aitoolsdirectory.com"
    tools = []
    page  = 1
    while len(tools) < limit:
        url  = f"{base}/?page={page}" if page > 1 else base + "/"
        html = fetch(url)
        if not html:
            break
        soup = BeautifulSoup(html, "html.parser")

        cards = soup.find_all("a", href=re.compile(r"/tools?/[^/]+"))
        if not cards:
            # Try article/card selectors
            cards = soup.select(".tool a, article a, .card a")
        if not cards:
            break

        prev = len(tools)
        for card in cards:
            if len(tools) >= limit:
                break
            href = card.get("href","")
            if not href.startswith("http"):
                href = urljoin(base, href)

            name_el = card.find(["h2","h3","h4","strong","span"],
                                 class_=re.compile(r"name|title|heading", re.I))
            if not name_el:
                name_el = card.find(["h2","h3","h4","strong"])
            name    = (name_el.get_text(strip=True) if name_el else "") or name_from_slug(href)
            desc_el = card.find("p")
            desc    = desc_el.get_text(strip=True) if desc_el else ""

            if not name or len(name) > 100:
                continue
            tools.append({
                "name":        clean_name(name),
                "tagline":     desc[:120] or name,
                "description": desc[:500],
                "website":     href,
                "category":    guess_category(name + " " + desc),
            })

        if len(tools) == prev:
            break
        print(f"  📄  Page {page}: total so far: {len(tools)}")
        page += 1
        time.sleep(DELAY)

    return tools


# ── SOURCE REGISTRY ────────────────────────────────────────────────────────────
SOURCES = [
    {"name": "Futurepedia",          "fn": scrape_futurepedia},
    {"name": "FutureTools",          "fn": scrape_futuretools},
    {"name": "Toolify.ai",           "fn": scrape_toolify},
    {"name": "AI Top Tools",         "fn": scrape_aitoptools},
    {"name": "There's An AI For That","fn": scrape_taaft},
    {"name": "AI Tools Directory",   "fn": scrape_aitoolsdirectory},
]

# ── MAIN ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    target = sys.argv[1].lower() if len(sys.argv) > 1 else None

    total_imported = 0

    for source in SOURCES:
        if target and target not in source["name"].lower():
            continue

        print(f"\n{'═'*60}")
        print(f"🔍  {source['name']}")
        print(f"{'═'*60}")

        tools = source["fn"]()
        print(f"\n  ✅  Scraped {len(tools)} tools from {source['name']}")

        # Send in batches of BATCH_SIZE
        for i in range(0, len(tools), BATCH_SIZE):
            batch   = tools[i:i+BATCH_SIZE]
            n       = flush(batch, f"{i+1}–{i+len(batch)}")
            total_imported += n
            time.sleep(1)

    print(f"\n\n{'═'*60}")
    print(f"🏁  ALL DONE — Total imported this run: {total_imported}")
    print(f"    Check https://www.listmyai.com/admin/listings")
    print(f"{'═'*60}\n")
