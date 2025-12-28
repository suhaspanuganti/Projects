# CiteseerX-Style Repository Sitemap & DOI Map Generator

## Overview

This project provides a **robust, scalable sitemap and DOI-mapping generator** for large, deeply sharded repositories modeled after **CiteseerX**.

It is designed to safely traverse **millions of documents** stored in a multi-level hexadecimal directory structure **without overloading the system**, by generating **branch-level sitemaps** instead of crawling the entire repository at once.

The tool outputs:

* **XML sitemaps** listing all discovered `document.pdf` URLs
* **CSV DOI maps** linking each PDF URL to its DOI (if available)
* An optional **sitemap index** referencing all branch sitemaps

---

## Problem Statement

The original CiteseerX repository design uses:

* 2-hex directory sharding (00–ff)
* Multiple shard levels
* 40-hex leaf directories containing PDFs

This structure creates **millions of directories**.

Naively crawling the entire tree:

* Causes excessive disk I/O
* Appears to “hang” on local machines
* Risks overloading production servers
* Makes debugging nearly impossible

**Goal:**
Create a **safe, controllable, reproducible** way to generate sitemaps and DOI mappings for such a repository.

---

## Key Design Decisions

### 1. Branch-Level Crawling (Critical)

Instead of crawling everything at once, the tool:

* Processes **one top-level branch (e.g., `02`) per run**
* Allows manual or scripted execution across branches
* Enables parallel or scheduled execution on servers

### 2. Aggressive Directory Pruning

Uses `os.walk(topdown=True)` with **in-place pruning** of directories:

* Only traverses valid 2-hex shard directories
* Only descends into valid 40-hex leaf directories
* Prevents unnecessary filesystem traversal

### 3. Leaf-Only Document Detection

Only directories that:

* Match a 40-hex name
* Contain `document.pdf`

are considered valid sitemap entries.

This prevents false positives and wasted work.

---

## Repository Structure (Expected)

```
csx_beta_repo/
├─ 00/
│  ├─ ab/
│  │  ├─ 3f/
│  │  │  └─ <40-hex-leaf>/
│  │  │       ├─ document.pdf
│  │  │       └─ meta.json
├─ 01/
├─ 02/
...
└─ ff/
```

* **Top level:** 2-hex branches (`00`–`ff`)
* **Intermediate levels:** 2-hex shard directories
* **Leaf level:** 40-hex directories containing PDFs

---

## Features

* ✅ Branch-scoped sitemap generation
* ✅ DOI extraction from `meta.json`
* ✅ Optional `lastModified` metadata usage
* ✅ CSV + XML output
* ✅ Sitemap index generation
* ✅ Throttling support (`--sleep`)
* ✅ Depth-limited debug listing (`--ls-depth`)
* ✅ Zero external dependencies (stdlib only)

---

## Output Files

For each branch (e.g., `02`):

* `sitemap_02.xml`
* `doi_map_02.csv`

Optional:

* `sitemap_index.xml`

---

## Installation & Setup

### Requirements

* Python **3.8+**
* Windows / Linux / macOS
* Large filesystem access

### Clone / Setup

```powershell
git clone <your-repo-url>
cd csx_sitemap_project
```

Project layout:

```
csx_sitemap_project/
├─ src/
│  └─ csx_sitemap_generator.py
├─ docs/
│  └─ README.md
├─ out/
├─ README.md
└─ .gitignore
```

---

## Usage

### Generate Sitemap for a Single Branch (Recommended)

```powershell
python .\src\csx_sitemap_generator.py `
  --root C:\csxrepo01_repo\csx_beta_repo `
  --base-url https://csx.local/repo `
  --out-dir .\out `
  --branches 02 `
  --sleep 0.01 `
  --write-index
```

### Generate Multiple Branches Manually

```powershell
python .\src\csx_sitemap_generator.py `
  --root C:\csxrepo01_repo\csx_beta_repo `
  --base-url https://csx.local/repo `
  --out-dir .\out `
  --branches 00,01,02,03 `
  --sleep 0.01 `
  --write-index
```

### Auto-Detect All Branches (Use Carefully)

```powershell
python .\src\csx_sitemap_generator.py `
  --root C:\csxrepo01_repo\csx_beta_repo `
  --base-url https://csx.local/repo `
  --out-dir .\out `
  --branches all `
  --sleep 0.01 `
  --write-index
```

---

## Common Issues & Lessons Learned

### “URL count = 0”

**Reason:**
Scanning a non-leaf directory (e.g., `02`) directly.

**Fix:**
The final generator descends automatically to 40-hex leaf directories.

---

### PowerShell `<branch>` Errors

PowerShell treats `< >` as operators.

**Fix:**
Use real values:

```powershell
--branches 02
```

not:

```powershell
--branches <branch>
```

---

### Script Not Found

Python must be run from:

* The script’s directory, **or**
* Using the full script path

---

## Performance Notes

* Directory pruning is essential
* Branch-level execution avoids server overload
* `--sleep` can be increased on shared storage
* Sitemaps can be generated incrementally over time

---

## Technologies Used

* **Python 3**
* `os.walk` (filesystem traversal)
* `argparse` (CLI)
* `re` (structure validation)
* `xml.sax.saxutils` (safe XML)
* `csv`, `json`, `datetime`

No third-party libraries required.

---

## Final Outcome

This project delivers:

* A **production-safe sitemap generator**
* Designed for **massive academic repositories**
* With clear operational controls
* And GitHub-ready documentation

It reflects real-world engineering constraints:
filesystem scale, performance, observability, and maintainability.

---
