#!/usr/bin/env python3
"""
ListmyAI — Local AI Tool Scraper
Run this from your laptop. Your home/office IP bypasses the blocks that hit Vercel.

Install deps:  pip install requests beautifulsoup4
Usage:         python3 scripts/scrape_and_import.py
"""

import requests
import json
import time
import re
import sys
from urllib.parse import urlparse
from bs4 import BeautifulSoup

# ── CONFIG ────────────────────────────────────────────────────────────────────
# Your live site import endpoint
IMPORT_URL = "https://www.listmyai.com/api/tools/import-batch"
IMPORT_SECRET = "listmyai_import_2026"   # matches IMPORT_SECRET env var in Vercel

# How many tools to scrape per source (set high — deduplication handles repeats)
LIMIT_PER_SOURCE = 500

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

SOURCES = [
    {"name": "There's An AI For That", "sitemap": "https://theresanaiforthat.com/sitemap.xml",
     "tool_pattern": r"^/ai/[^/]+/?$"},
    {"name": "Futurepedia",            "sitemap": "https://www.futurepedia.io/sitemap.xml",
     "tool_pattern": r"^/tool/[^/]+/?$"},
    {"name": "FutureTools",            "sitemap": "https://www.futuretools.io/sitemap.xml",
     "tool_pattern": r"^/tools/[^/]+/?$"},
    {"name": "Toolify.ai",             "sitemap": "https://www.toolify.ai/sitemap.xml",
     "tool_pattern": r"^/(en/)?tool/[^/]+/?$"},
    {"name": "AI Top Tools",           "sitemap": "https://aitoptools.com/sitemap.xml",
     "tool_pattern": r"^/tools/[^/]+/?$"},
    {"name": "AI Tools Directory",     "sitemap": "https://aitoolsdirectory.com/sitemap.xml",
     "tool_pattern": r"^/tools?/[^/]+/?$"},
]

CATEGORY_RULES = [
    (r"image|photo|art|dall|midjourney|stable.diff",  "Image Generation"),
    (r"video|film|animation|clip",                     "Video Generation"),
    (r"audio|music|sound|voice|speech|tts",            "Audio & Music"),
    (r"code|program|developer|github|debug",           "Code Assistant"),
    (r"seo|marketing|ads|campaign",                    "SEO & Marketing"),
    (r"write|writing|copy|blog|essay|content",         "Writing & Copy"),
    (r"data|analytic|chart|spreadsheet",               "Data & Analytics"),
    (r"search|research|knowledge",                     "AI Search"),
    (r"automat|workflow|integrat",                     "Automation"),
    (r"education|learn|study|tutor",                   "Education"),
    (r"health|medical|fitness",                        "Healthcare"),
    (r"finance|legal|law|contract",                    "Finance & Legal"),
    (r"chat|assistant|bot|gpt",                        "Chatbot / Assistant"),
]

def guess_category(text):
    t = text.lower()
    for pattern, cat in CATEGORY_RULES:
        if re.search(pattern, t):
            return cat
    return "Other"

def name_from_slug(url):
    path = urlparse(url).path
    slug = [p for p in path.split("/") if p]
    if slug:
        return slug[-1].replace("-", " ").title()
    return ""

def fetch(url, timeout=10):
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout)
        r.raise_for_status()
        return r.text
    except Exception as e:
        print(f"  ⚠  fetch failed {url}: {e}")
        return None

def parse_sitemap(xml):
    return re.findall(r"<loc>\s*(https?://[^\s<]+)\s*</loc>", xml, re.IGNORECASE)

def scrape_tool_page(url):
    html = fetch(url, timeout=8)
    if not html:
        return None
    soup = BeautifulSoup(html, "html.parser")

    def og(prop):
        tag = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop})
        return tag["content"].strip() if tag and tag.get("content") else ""

    name = og("og:title") or og("twitter:title") or (soup.title.string.strip() if soup.title else "")
    name = re.sub(r"\s*[-|–—]\s*\S+.*$", "", name).strip()
    if not name:
        name = name_from_slug(url)
    if not name:
        return None

    description = og("og:description") or og("twitter:description") or og("description")
    description = description[:500]

    # Find external link (the actual tool website)
    page_host = urlparse(url).hostname
    website = url  # fallback to listing URL
    skip = {"google.com", "twitter.com", "facebook.com", "instagram.com",
            "linkedin.com", "youtube.com", page_host}
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.startswith("http"):
            try:
                h = urlparse(href).hostname or ""
                if not any(s in h for s in skip):
                    website = href.rstrip("/")
                    break
            except:
                pass

    category = guess_category(name + " " + description)
    tagline = (description.split(".")[0] or name)[:120]

    return {
        "name": name,
        "tagline": tagline,
        "description": description,
        "website": website,
        "category": category,
    }

def import_batch(tools):
    """POST tools to the ListmyAI import API."""
    try:
        r = requests.post(
            IMPORT_URL,
            json={"tools": tools, "secret": IMPORT_SECRET},
            headers={"Content-Type": "application/json"},
            timeout=30,
        )
        data = r.json()
        return data
    except Exception as e:
        return {"error": str(e)}

def scrape_source(source):
    print(f"\n🔍  {source['name']}")
    xml = fetch(source["sitemap"], timeout=15)
    if not xml:
        print("  ✗  Could not fetch sitemap")
        return

    all_urls = parse_sitemap(xml)

    # Follow sitemap index if needed
    if any("sitemap" in u for u in all_urls[:5]):
        child_urls = []
        for child in [u for u in all_urls if "sitemap" in u][:5]:
            child_xml = fetch(child)
            if child_xml:
                child_urls.extend(parse_sitemap(child_xml))
        all_urls = child_urls

    host = urlparse(source["sitemap"]).hostname
    pattern = source["tool_pattern"]
    tool_urls = [u for u in all_urls
                 if urlparse(u).hostname == host and re.search(pattern, urlparse(u).path)]

    print(f"  📋  Found {len(tool_urls)} tool URLs in sitemap")
    tool_urls = tool_urls[:LIMIT_PER_SOURCE]

    tools = []
    for i, url in enumerate(tool_urls):
        result = scrape_tool_page(url)
        if result:
            tools.append(result)
            print(f"  ✓  [{i+1}/{len(tool_urls)}] {result['name']}")
        else:
            print(f"  ✗  [{i+1}/{len(tool_urls)}] failed: {url}")

        # Batch import every 50 tools
        if len(tools) >= 50:
            print(f"\n  📤  Sending batch of {len(tools)} tools to ListmyAI...")
            result = import_batch(tools)
            print(f"  → {result}")
            tools = []
            time.sleep(1)

        time.sleep(0.3)  # polite delay

    # Import remaining
    if tools:
        print(f"\n  📤  Sending final batch of {len(tools)} tools...")
        result = import_batch(tools)
        print(f"  → {result}")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else None
    for source in SOURCES:
        if target and target.lower() not in source["name"].lower():
            continue
        scrape_source(source)
    print("\n✅  Done! Check Admin → Listings on listmyai.com")
