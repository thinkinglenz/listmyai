#!/usr/bin/env python3
"""
ListmyAI — AI Tool Scraper
Sources that actually work without Cloudflare blocks:
  1. Futurepedia  — category pages + tool detail pages (has "Visit Site" link)
  2. GitHub Awesome AI Lists  — 1000+ tools from curated markdown files
  3. AI Collective Tools  — huge markdown list

Install:  pip install requests beautifulsoup4
Usage:    python3 scripts/scrape_and_import.py
          python3 scripts/scrape_and_import.py futurepedia
          python3 scripts/scrape_and_import.py github
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
LIMIT         = 500
BATCH_SIZE    = 50
DELAY         = 0.4   # seconds between requests

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

CATEGORY_RULES = [
    (r"image|photo|art|dall|midjourney|stable.diff|flux|firefly",  "Image Generation"),
    (r"video|film|animation|clip|sora|runway",                      "Video Generation"),
    (r"audio|music|sound|voice|speech|tts|podcast|eleven",          "Audio & Music"),
    (r"code|program|developer|github|debug|cursor|copilot",         "Code Assistant"),
    (r"seo|marketing|ads|campaign|brand|social media",              "SEO & Marketing"),
    (r"write|writing|copy|blog|essay|content|jasper",               "Writing & Copy"),
    (r"data|analytic|chart|spreadsheet|sql|\bBI\b",                 "Data & Analytics"),
    (r"search|research|knowledge|perplexity",                       "Research"),
    (r"automat|workflow|integrat|zapier|make\b|n8n",                "Automation"),
    (r"education|learn|study|tutor|quiz|course",                    "Education"),
    (r"health|medical|fitness|mental",                              "Healthcare"),
    (r"finance|legal|law|contract|accounting",                      "Finance & Legal"),
    (r"design|ui|ux|figma|canva|logo|3d",                          "Design & Creative"),
    (r"chat|assistant|bot|gpt|claude|gemini|llm|ai model",          "Chatbot / Assistant"),
]

def guess_category(text):
    t = (text or "").lower()
    for pattern, cat in CATEGORY_RULES:
        if re.search(pattern, t):
            return cat
    return "Other"

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

def name_from_slug(url):
    parts = [p for p in urlparse(url).path.split("/") if p]
    return parts[-1].replace("-", " ").title() if parts else ""

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
    print(f"\n  📤  Sending {len(tools)} tools{' (' + label + ')' if label else ''}…")
    result = import_batch(tools)
    imported = result.get("imported", 0)
    skipped  = result.get("skipped", 0)
    errs     = result.get("errors", [])
    print(f"  → imported: {imported}  skipped: {skipped}" +
          (f"  errors: {errs[:2]}" if errs else ""))
    return imported


# ═══════════════════════════════════════════════════════════════════════════════
# 1. FUTUREPEDIA
# ═══════════════════════════════════════════════════════════════════════════════

FUTUREPEDIA_CATEGORIES = [
    "chatbots", "productivity", "image-generators", "writing-tools",
    "code-assistant", "video-generators", "audio-music", "seo-tools",
    "research-tools", "design-tools", "marketing-tools", "data-analytics",
    "automation-tools", "education-tools", "finance-tools",
]

SKIP_HOSTS = {
    "futurepedia.io", "google.com", "twitter.com", "x.com",
    "facebook.com", "instagram.com", "linkedin.com", "youtube.com",
    "tiktok.com", "discord.gg", "discord.com",
}

def futurepedia_visit_site(url):
    """Fetch a tool page and extract name, description, actual website."""
    html = fetch(url)
    if not html:
        return None
    soup = BeautifulSoup(html, "html.parser")

    name = og(soup, "og:title") or og(soup, "twitter:title") or ""
    # Strip review suffixes: "ChatGPT AI Reviews: ..." → "ChatGPT"
    name = re.sub(r"\s+(AI )?Reviews?:.*$", "", name, flags=re.I).strip()
    name = re.sub(r"\s*[-|–—]\s*Futurepedia.*$", "", name, flags=re.I).strip()
    if not name:
        name = name_from_slug(url)

    desc = og(soup, "og:description") or og(soup, "twitter:description") or ""

    # Find "Visit Site" link
    website = None
    for a in soup.find_all("a", href=True):
        href = a.get("href", "")
        if not href.startswith("http"):
            continue
        try:
            host = re.sub(r"^www\.", "", urlparse(href).hostname or "")
            if not any(s in host for s in SKIP_HOSTS):
                text = a.get_text(strip=True).lower()
                if any(w in text for w in ["visit site", "visit tool", "visit website", "open", "launch", "go to"]):
                    website = re.sub(r"\?utm_.*", "", href)  # strip UTM params
                    break
        except:
            pass

    return {
        "name":        name,
        "tagline":     (desc.split(".")[0] or name)[:120],
        "description": desc[:500],
        "website":     website or url,
        "category":    guess_category(name + " " + desc),
    }

def scrape_futurepedia(limit=LIMIT):
    base  = "https://www.futurepedia.io"
    seen  = set()
    tools = []

    for cat in FUTUREPEDIA_CATEGORIES:
        if len(tools) >= limit:
            break
        for page in range(1, 8):  # up to 7 pages per category
            if len(tools) >= limit:
                break
            url = f"{base}/ai-tools/{cat}" + (f"?page={page}" if page > 1 else "")
            html = fetch(url)
            if not html:
                break
            soup = BeautifulSoup(html, "html.parser")

            # Get all /tool/ links
            tool_links = []
            for a in soup.find_all("a", href=re.compile(r"^https?://www\.futurepedia\.io/tool/|^/tool/")):
                href = a.get("href", "")
                full = href if href.startswith("http") else urljoin(base, href)
                # Only keep the canonical URL (no query params), deduplicate
                clean = re.sub(r"\?.*", "", full)
                if clean not in seen:
                    seen.add(clean)
                    tool_links.append(clean)

            if not tool_links:
                break  # no more tools on this category page

            print(f"  📄  {cat} p{page}: {len(tool_links)} new tool URLs")

            for tool_url in tool_links:
                if len(tools) >= limit:
                    break
                result = futurepedia_visit_site(tool_url)
                if result and result["name"]:
                    tools.append(result)
                    print(f"    ✓  {result['name']} → {result['website'][:50]}")
                time.sleep(DELAY)

    return tools


# ═══════════════════════════════════════════════════════════════════════════════
# 2. GITHUB AWESOME LISTS (markdown, always accessible)
# ═══════════════════════════════════════════════════════════════════════════════

GITHUB_LISTS = [
    # (name, raw_url, tool_pattern)
    ("AI Collective Tools",
     "https://raw.githubusercontent.com/Hyraze/ai-collective-tools/main/README.md",
     r"\[([^\]]{2,60})\]\((https?://[^\)]+)\)(?:[^\n]*?[-–:]\s*([^\n]{10,200}))?"),

    ("Awesome Generative AI",
     "https://raw.githubusercontent.com/steven2358/awesome-generative-ai/master/README.md",
     r"\[([^\]]{2,60})\]\((https?://[^\)]+)\)(?:[^\n]*?[-–:]\s*([^\n]{10,200}))?"),

    ("Awesome AI Tools",
     "https://raw.githubusercontent.com/mahseema/awesome-ai-tools/main/README.md",
     r"\*\*\[([^\]]{2,60})\]\((https?://[^\)]+)\)\*\*\s*[-–:]\s*([^\n]{10,200})"),

    ("Awesome ChatGPT",
     "https://raw.githubusercontent.com/humanloop/awesome-chatgpt/main/README.md",
     r"\[([^\]]{2,60})\]\((https?://[^\)]+)\)(?:[^\n]*?[-–:]\s*([^\n]{10,200}))?"),
]

# URLs to skip (docs, github repos, papers, social media)
SKIP_URL_PATTERNS = re.compile(
    r"github\.com/(features|topics|collections|explore)|"
    r"arxiv\.org|youtube\.com|twitter\.com|x\.com|reddit\.com|"
    r"medium\.com|substack\.com|notion\.so|docs\.|#|^mailto",
    re.I
)

def scrape_github_lists(limit=LIMIT):
    tools   = []
    seen    = set()

    for list_name, raw_url, pattern in GITHUB_LISTS:
        if len(tools) >= limit:
            break
        print(f"\n  📚  {list_name}")
        html = fetch(raw_url)
        if not html:
            continue

        matches = re.findall(pattern, html)
        added = 0
        for match in matches:
            if len(tools) >= limit:
                break
            name = match[0].strip()
            url  = match[1].strip().rstrip("/")
            desc = match[2].strip() if len(match) > 2 else ""

            # Filter junk
            if not name or not url:
                continue
            if SKIP_URL_PATTERNS.search(url):
                continue
            if url in seen:
                continue
            # Skip lines that are section headers (##, ###)
            if re.match(r"^#{1,4}\s", name):
                continue
            # Skip obvious non-tool names
            if any(w in name.lower() for w in ["awesome", "list of", "collection", "resources", "introduction to"]):
                continue
            if len(name) > 80 or len(name) < 2:
                continue

            seen.add(url)
            category = guess_category(name + " " + desc)
            tools.append({
                "name":        name,
                "tagline":     (desc[:120] or name),
                "description": desc[:500],
                "website":     url,
                "category":    category,
            })
            added += 1

        print(f"    → {added} tools extracted")

    return tools


# ═══════════════════════════════════════════════════════════════════════════════
# SOURCE REGISTRY
# ═══════════════════════════════════════════════════════════════════════════════

SOURCES = [
    {"name": "Futurepedia",   "fn": scrape_futurepedia},
    {"name": "GitHub Lists",  "fn": scrape_github_lists},
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

        for i in range(0, len(tools), BATCH_SIZE):
            batch = tools[i : i + BATCH_SIZE]
            n = flush(batch, f"{i+1}–{i+len(batch)}")
            total_imported += n
            time.sleep(1)

    print(f"\n{'═'*60}")
    print(f"🏁  DONE — Total imported this run: {total_imported}")
    print(f"    Check https://www.listmyai.com/admin/listings")
    print(f"{'═'*60}\n")
