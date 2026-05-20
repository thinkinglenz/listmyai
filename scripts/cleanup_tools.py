#!/usr/bin/env python3
"""
Cleanup script — remove junk tools imported by the GitHub scraper.
Identifies and deletes entries that are:
  - Badge images (img.shields.io, badge URLs)
  - GitHub repos (not actual product websites)
  - Markdown artifacts (names starting with !, [, etc.)
  - Names that are clearly not tools (Pull Requests, Issues, etc.)
  - Extremely short/generic names
  - Websites pointing to github.com (repos, not products)

Usage:
  python3 scripts/cleanup_tools.py          # dry run — shows what would be deleted
  python3 scripts/cleanup_tools.py --delete  # actually delete
"""

import requests
import re
import sys

SUPABASE_URL = "https://bklftjfkzgxwbsglmzuw.supabase.co"
# Use service role key for delete operations
IMPORT_URL = "https://www.listmyai.com/api/tools/import-batch"
IMPORT_SECRET = "listmyai_import_2026"

# We'll use the Supabase REST API directly
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbGZ0amZremJ4d2JzZ2xtenV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MDQ3NTMsImV4cCI6MjA2Mjk4MDc1M30.SGHK8SjhHnrOxJ1JNQq2YH9b0SLsV6EMQKUhFdFLNfc"

HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
}

# ── Junk detection rules ─────────────────────────────────────────────────────

# Bad website patterns (not real product URLs)
BAD_WEBSITE_PATTERNS = re.compile(
    r"img\.shields\.io|"
    r"badge\.|"
    r"github\.com/[^/]+/[^/]+$|"           # bare github repos
    r"github\.com/[^/]+/[^/]+/?(#|$)|"     # github repos with fragment
    r"github\.com/[^/]+/[^/]+/blob/|"       # github file links
    r"github\.com/[^/]+/[^/]+/tree/|"       # github tree links
    r"github\.com/[^/]+/[^/]+/issues|"      # github issues
    r"github\.com/[^/]+/[^/]+/pulls|"       # github PRs
    r"github\.com/[^/]+/[^/]+/wiki|"        # github wiki
    r"github\.com/[^/]+/[^/]+/releases|"    # github releases
    r"github\.com/sponsors/|"
    r"github\.com/apps/|"
    r"gist\.github\.com|"
    r"raw\.githubusercontent\.com|"
    r"user-images\.githubusercontent\.com|"
    r"camo\.githubusercontent\.com|"
    r"opencollective\.com|"
    r"patreon\.com|"
    r"buymeacoffee\.com|"
    r"ko-fi\.com|"
    r"paypal\.com|"
    r"npmjs\.com|"
    r"pypi\.org|"
    r"hub\.docker\.com|"
    r"marketplace\.visualstudio\.com",
    re.I
)

# Bad name patterns (markdown artifacts, badges, non-tools)
BAD_NAME_PATTERNS = re.compile(
    r"^!\[|"                    # markdown images ![
    r"^\[!|"                    # markdown badge refs [!
    r"^Pull Request|"
    r"^Issues?$|"
    r"^Stars?$|"
    r"^Forks?$|"
    r"^License$|"
    r"^Contributors?$|"
    r"^Back to Top$|"
    r"^Table of Contents$|"
    r"^Contributing$|"
    r"^Sponsor|"
    r"^Donate|"
    r"^README|"
    r"^CHANGELOG|"
    r"^TODO$|"
    r"^API$|"
    r"^\d+$|"                   # just numbers
    r"^[A-Z]{1,3}$|"           # just 1-3 uppercase letters
    r"svg\d*$",                 # svg badge refs
    re.I
)

# Names that are too generic or clearly not AI tools
GENERIC_NAMES = {
    "pull requests", "issues", "stars", "forks", "license",
    "contributing", "sponsor", "donate", "back to top",
    "table of contents", "readme", "changelog", "todo",
    "api", "open source", "awesome", "free", "paid",
}


def is_junk(tool):
    """Return reason string if tool is junk, None if it looks legit."""
    name = tool.get("name", "")
    website = tool.get("website", "")
    tagline = tool.get("tagline", "")
    desc = tool.get("description", "")

    # Check bad names
    if BAD_NAME_PATTERNS.search(name):
        return f"bad name pattern: {name[:50]}"

    # Check generic names
    if name.lower().strip() in GENERIC_NAMES:
        return f"generic name: {name}"

    # Check bad websites
    if BAD_WEBSITE_PATTERNS.search(website):
        return f"bad website: {website[:80]}"

    # GitHub repo URLs (no actual product website)
    if re.match(r"https?://github\.com/[^/]+/[^/]+/?$", website):
        return f"github repo URL: {website[:80]}"

    # Name contains markdown artifacts
    if name.startswith("!") or name.startswith("["):
        return f"markdown artifact: {name[:50]}"

    # Empty or useless tagline (same as name, or very short)
    if not desc and not tagline:
        pass  # not junk by itself, just sparse

    # Website is just a shield/badge
    if "shields.io" in website or "badge" in website.lower():
        return f"badge URL: {website[:80]}"

    return None


def main():
    delete_mode = "--delete" in sys.argv

    print("Fetching all tools from Supabase...")
    # Fetch all tools via REST API
    all_tools = []
    offset = 0
    while True:
        url = f"{SUPABASE_URL}/rest/v1/ai_tools?select=id,name,website,tagline,description,slug&order=created_at.desc&offset={offset}&limit=1000"
        r = requests.get(url, headers=HEADERS)
        batch = r.json()
        if not batch:
            break
        all_tools.extend(batch)
        if len(batch) < 1000:
            break
        offset += 1000

    print(f"Total tools in DB: {len(all_tools)}")

    junk = []
    for tool in all_tools:
        reason = is_junk(tool)
        if reason:
            junk.append((tool, reason))

    print(f"\nFound {len(junk)} junk entries:\n")

    for tool, reason in junk:
        print(f"  ❌  {tool['name'][:40]:<40}  →  {reason}")

    if not junk:
        print("  ✅  No junk found!")
        return

    print(f"\n{'─'*60}")
    print(f"Total junk: {len(junk)} / {len(all_tools)} tools")

    if not delete_mode:
        print(f"\nDry run — add --delete to actually remove these entries.")
        return

    print(f"\nDeleting {len(junk)} junk entries...")
    deleted = 0
    errors = 0
    for tool, reason in junk:
        url = f"{SUPABASE_URL}/rest/v1/ai_tools?id=eq.{tool['id']}"
        r = requests.delete(url, headers=HEADERS)
        if r.status_code in (200, 204):
            deleted += 1
        else:
            errors += 1
            print(f"  ⚠  Failed to delete {tool['name']}: {r.status_code} {r.text[:100]}")

    print(f"\n✅  Deleted: {deleted}  Errors: {errors}")


if __name__ == "__main__":
    main()
