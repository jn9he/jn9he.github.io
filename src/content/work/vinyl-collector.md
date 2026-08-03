---
title: "Vinyl Collector"
date: "07/2026"
category: "Data Science"
thumbnail: "/images/project-bloom.jpg"
description: "Computer vision and ETL pipeline that identifies vinyl record covers and catalogs them against Discogs data."
images:
  - "/images/vinyl-collector-01.png"
  - "/images/vinyl-collector-02.png"
---

## Overview

An end-to-end tool for record collectors: point a camera at a vinyl cover and match it to its listing on Discogs, then track it in a personal, searchable collection.

## Approach

- Wrote a data scraping pipeline against the Discogs API and catalog pages to build a reference dataset of covers, artists, and release metadata.
- Used DINOv2 embeddings alongside PaddleOCR/EasyOCR text extraction so covers can be matched by visual similarity even when text is worn, faded, or partially obscured.
- Stored embeddings and structured release data in PostgreSQL for fast lookup.
- Served identification through a Flask backend with a Tailwind-based front end for browsing and searching the catalog.

## Outcomes

- Cuts down manual cataloging — a photo replaces looking up each record by hand.
- Handles imperfect real-world cover conditions, not just clean scans.
