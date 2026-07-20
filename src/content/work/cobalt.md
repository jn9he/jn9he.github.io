---
title: "Cobalt"
date: "12/2025"
category: "Data Science"
thumbnail: "https://placehold.co/800x1000/161616/363636?text=Cobalt"
description: "Recommendation engine for academic course selection using collaborative filtering and content-based methods."
images:
  - "https://placehold.co/1200x800/161616/363636?text=Cobalt+01"
  - "https://placehold.co/1200x800/161616/363636?text=Cobalt+02"
  - "https://placehold.co/1200x800/161616/363636?text=Cobalt+03"
---

## Overview

A hybrid recommendation system that suggests courses to students based on their academic history, interests, and peer patterns. Combines collaborative filtering with content-based features.

## Architecture

Matrix factorization (ALS) for collaborative signals, combined with a content-based model using course descriptions and learning outcomes. Served via a Flask API with Redis caching.

## Results

- 78% of recommendations rated "relevant" by students
- 23% increase in elective course satisfaction scores
- Handles 5,000+ concurrent users during registration periods
