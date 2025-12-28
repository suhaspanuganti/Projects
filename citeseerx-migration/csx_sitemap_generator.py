#!/usr/bin/env python3
"""
csx_sitemap_generator.py

Generate per-branch sitemap XML + DOI CSV for a CiteseerX-style sharded repository.
Designed to avoid crawling the full repo at once by scanning one top-level branch (00..ff) per run,
or scanning multiple branches in a controlled loop.

Directory model (your established model):
- Top-level branches: 2-hex directories (00..ff)
- Intermediate shard dirs: 2-hex (levels)
- Leaf dirs: 40-hex (SHA1-like) containing document.pdf (+ optional meta.json)

Key idea:
- Use os.walk(topdown=True) + prune dirs[] to avoid scanning irrelevant directories.
"""

import os
import re
import csv
import json
import time
import argparse
from datetime import datetime, timezone
from xml.sax.saxutils import escape as xml_escape
from typing import Optional, List, Tuple

HEX2  = re.compile(r"^[0-9a-f]{2}$", re.I)
HEX40 = re.compile(r"^[0-9a-f]{40}$", re.I)

DEFAULT_ROOT = r"C:\csxrepo01_repo\csx_beta_repo"
DEFAULT_BASE_URL = "https://csx.local/repo"
DEFAULT_OUT_DIR = r"C:\csxrepo01_repo\out"
DEFAULT_SHARD_DEPTH = 7
# NOTE: This follows your earlier convention:
# - When branch NOT set: shard_depth defaults to 7
# - When branch IS set: shard_depth defaults to 6
# This is "number of 2-hex shard levels from EFFECTIVE root to the 40-hex parent".

def rel_depth(root: str, path: str) -> int:
    rel = os.path.relpath(path, root)
    return 0 if rel == "." else len(rel.split(os.sep))

def lastmod_iso8601(path: str) -> str:
    ts = datetime.fromtimestamp(os.path.getmtime(path), tz=timezone.utc)
    return ts.strftime("%Y-%m-%dT%H:%M:%SZ")

def get_lastmod_pref_meta(leaf_dir: str, pdf_path: str) -> str:
    meta_path = os.path.join(leaf_dir, "meta.json")
    try:
        if os.path.exists(meta_path):
            with open(meta_path, "r", encoding="utf-8-sig") as f:
                data = json.load(f)
            rec = data.get("record")
            if isinstance(rec, dict):
                lm = rec.get("lastModified")
                if isinstance(lm, str) and lm.strip():
                    return lm.strip()
    except Exception:
        pass
    return lastmod_iso8601(pdf_path)

def get_meta_doi(leaf_dir: str) -> str:
    meta_path = os.path.join(leaf_dir, "meta.json")
    if not os.path.exists(meta_path):
        return ""
    try:
        with open(meta_path, "r", encoding="utf-8-sig") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            return ""
        d = data.get("doi") or (data.get("metadata", {}) or {}).get("doi")
        if isinstance(d, str) and d.strip():
            return d.strip()
    except Exception:
        return ""
    return ""

def is_leaf_dir(effective_root: str, current_dir: str, shard_depth: int) -> bool:
    # leaf dir = depth == shard_depth + 1 and basename is 40-hex
    return (rel_depth(effective_root, current_dir) == shard_depth + 1) and bool(HEX40.match(os.path.basename(current_dir)))

def detect_branches(root: str) -> List[str]:
    try:
        kids = os.listdir(root)
    except Exception:
        return []
    branches = [d for d in kids if HEX2.match(d) and os.path.isdir(os.path.join(root, d))]
    branches.sort(key=lambda s: s.lower())
    return branches

def prune_dirs(depth_here: int, dirs: List[str], shard_depth: int) -> None:
    """
    Mutates dirs[:] in-place according to expected structure.
    """
    if depth_here == 0:
        dirs[:] = [d for d in dirs if HEX2.match(d)]
    elif 1 <= depth_here < shard_depth:
        dirs[:] = [d for d in dirs if HEX2.match(d)]
    elif depth_here == shard_depth:
        dirs[:] = [d for d in dirs if HEX40.match(d)]
    else:
        dirs[:] = []

def write_sitemap_and_doi_for_branch(
    repo_root: str,
    branch: str,
    base_url: str,
    out_dir: str,
    shard_depth: int,
    sleep_s: float = 0.0,
    ls_depth: int = 0,
    max_urls: Optional[int] = None,
) -> Tuple[str, str, int, int]:
    """
    Returns:
      (sitemap_path, doi_csv_path, url_count, leaf_checked)
    """
    effective_root = os.path.join(repo_root, branch) if branch else repo_root
    if not os.path.isdir(effective_root):
        raise SystemExit(f"Root not found: {effective_root}")

    # Adjust shard_depth automatically if branch is set and user did not pre-adjust.
    # This follows your established convention.
    effective_shard_depth = shard_depth
    if branch:
        # If user passes DEFAULT_SHARD_DEPTH (7), we reduce to 6 automatically.
        # If user already passed 6 explicitly, it stays 6.
        if shard_depth == DEFAULT_SHARD_DEPTH:
            effective_shard_depth = DEFAULT_SHARD_DEPTH - 1

    os.makedirs(out_dir, exist_ok=True)
    tag = branch if branch else "ALL"

    sitemap_path = os.path.join(out_dir, f"sitemap_{tag}.xml")
    doi_csv_path = os.path.join(out_dir, f"doi_map_{tag}.csv")

    url_count = 0
    leaf_checked = 0

    with open(sitemap_path, "w", encoding="utf-8") as sm, open(doi_csv_path, "w", encoding="utf-8", newline="") as doi_f:
        sm.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        sm.write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')

        writer = csv.writer(doi_f)
        writer.writerow(["url", "doi"])

        for cur_root, dirs, files in os.walk(effective_root, topdown=True):
            if sleep_s > 0:
                time.sleep(sleep_s)

            depth_here = rel_depth(effective_root, cur_root)
            prune_dirs(depth_here, dirs, effective_shard_depth)

            if ls_depth and depth_here <= ls_depth:
                print(f"== Depth {depth_here}: {cur_root} ==")
                for d in dirs:
                    print("DIR ", os.path.join(cur_root, d))

            if is_leaf_dir(effective_root, cur_root, effective_shard_depth):
                leaf_checked += 1

                pdf_path = os.path.join(cur_root, "document.pdf")
                if os.path.exists(pdf_path):
                    rel_leaf = os.path.relpath(cur_root, effective_root).replace(os.sep, "/")
                    # URL should include branch prefix when effective_root is branch-scoped
                    if branch:
                        url = f"{base_url}/{branch}/{rel_leaf}/document.pdf"
                    else:
                        url = f"{base_url}/{rel_leaf}/document.pdf"

                    lm = get_lastmod_pref_meta(cur_root, pdf_path)

                    sm.write("  <url>\n")
                    sm.write(f"    <loc>{xml_escape(url)}</loc>\n")
                    sm.write(f"    <lastmod>{xml_escape(lm)}</lastmod>\n")
                    sm.write("  </url>\n")

                    doi = get_meta_doi(cur_root)
                    writer.writerow([url, doi])

                    url_count += 1
                    if max_urls is not None and url_count >= max_urls:
                        break

        sm.write("</urlset>\n")
        sm.write(f"<!-- url_count: {url_count} | leaf_checked: {leaf_checked} -->\n")

    return sitemap_path, doi_csv_path, url_count, leaf_checked

def write_sitemap_index(out_dir: str, sitemap_files: List[str], base_url_for_sitemaps: Optional[str] = None) -> str:
    """
    Creates sitemap_index.xml referencing sitemap files.
    If base_url_for_sitemaps is provided, it will build <loc> with that URL + filename.
    Otherwise, it writes file names as-is (still valid for local use).
    """
    index_path = os.path.join(out_dir, "sitemap_index.xml")
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    with open(index_path, "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n')
        f.write('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for p in sitemap_files:
            name = os.path.basename(p)
            loc = f"{base_url_for_sitemaps.rstrip('/')}/{name}" if base_url_for_sitemaps else name
            f.write("  <sitemap>\n")
            f.write(f"    <loc>{xml_escape(loc)}</loc>\n")
            f.write(f"    <lastmod>{xml_escape(now)}</lastmod>\n")
            f.write("  </sitemap>\n")
        f.write("</sitemapindex>\n")

    return index_path

def parse_branches_arg(branches_arg: str) -> List[str]:
    # accepts "02,0a,FF" or "all"
    if not branches_arg:
        return []
    if branches_arg.strip().lower() == "all":
        return ["__ALL__"]
    parts = [p.strip() for p in branches_arg.split(",") if p.strip()]
    return parts

def main():
    ap = argparse.ArgumentParser(description="CiteseerX-style sitemap + DOI map generator (branch-friendly).")
    ap.add_argument("--root", default=DEFAULT_ROOT, help="Repo root directory (contains 00..ff branches).")
    ap.add_argument("--base-url", default=DEFAULT_BASE_URL, help="Base URL prefix (e.g., https://csx.local/repo).")
    ap.add_argument("--out-dir", default=DEFAULT_OUT_DIR, help="Output directory for sitemaps and doi maps.")
    ap.add_argument("--branches", default="", help="Comma list like '02,0a,ff' OR 'all' to auto-detect all 2-hex branches.")
    ap.add_argument("--shard-depth", type=int, default=DEFAULT_SHARD_DEPTH,
                    help="Shard depth (your convention). Default 7; when branch is set, auto-adjusts 7->6.")
    ap.add_argument("--sleep", type=float, default=0.0, help="Sleep seconds per os.walk step (throttle).")
    ap.add_argument("--ls-depth", type=int, default=0, help="Print directory listings up to this depth (0=off).")
    ap.add_argument("--max-urls", type=int, default=0, help="Stop after N URLs (0 = no limit).")
    ap.add_argument("--write-index", action="store_true", help="Write sitemap_index.xml referencing branch sitemaps.")
    ap.add_argument("--index-base-url", default="", help="Optional base URL where sitemap files will be hosted.")
    args = ap.parse_args()

    repo_root = args.root
    if not os.path.isdir(repo_root):
        raise SystemExit(f"Root not found: {repo_root}")

    branches = parse_branches_arg(args.branches)
    if branches == ["__ALL__"]:
        branches = detect_branches(repo_root)
        if not branches:
            raise SystemExit("No 2-hex branches found under root.")
    elif not branches:
        # If user doesn’t pass branches, we DO NOT crawl everything by default.
        raise SystemExit("Pass --branches (e.g., --branches 02) or --branches all")

    max_urls = args.max_urls if args.max_urls > 0 else None

    sitemap_files: List[str] = []
    total_urls = 0
    total_leaf = 0

    for b in branches:
        b_norm = b.strip()
        if not HEX2.match(b_norm):
            print(f"[skip] invalid branch name: {b_norm}")
            continue

        print(f"\n=== Processing branch: {b_norm} ===")
        sm_path, doi_path, url_count, leaf_checked = write_sitemap_and_doi_for_branch(
            repo_root=repo_root,
            branch=b_norm,
            base_url=args.base_url.rstrip("/"),
            out_dir=args.out_dir,
            shard_depth=args.shard_depth,
            sleep_s=args.sleep,
            ls_depth=args.ls_depth,
            max_urls=max_urls,
        )

        print(f"  Sitemap: {sm_path}")
        print(f"  DOI map: {doi_path}")
        print(f"  URLs: {url_count} | Leaf dirs checked: {leaf_checked}")

        sitemap_files.append(sm_path)
        total_urls += url_count
        total_leaf += leaf_checked

    if args.write_index and sitemap_files:
        index_url_base = args.index_base_url.strip() or None
        idx_path = write_sitemap_index(args.out_dir, sitemap_files, index_url_base)
        print(f"\nSitemap index written: {idx_path}")

    print(f"\nDONE. Total URLs: {total_urls} | Total leaf dirs checked: {total_leaf}")
    print(f"Outputs in: {args.out_dir}")

if __name__ == "__main__":
    main()
