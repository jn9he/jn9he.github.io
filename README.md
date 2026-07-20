# jn9he.github.io

Personal portfolio website built with Jekyll using the [Mundana theme](https://github.com/codebygina/mundana-theme-jekyll).

## About

A portfolio showcasing work in **Statistics**, **Data Science**, and **Design** — built by a statistics undergraduate with minors in data science and design.

## Local Development

### Prerequisites
- Ruby 2.7+ and Bundler
- Jekyll 4.x

### Setup

```bash
# Install dependencies
bundle install

# Serve locally
bundle exec jekyll serve

# Visit http://localhost:4000
```

## Structure

```
├── _config.yml          # Site configuration
├── _layouts/            # Page templates (default, page, post)
├── _includes/           # Reusable components (header, footer, sidebar)
├── _pages/              # Static pages (about, projects, categories)
├── _posts/              # Portfolio project posts
├── assets/
│   ├── css/main.css     # Custom styles
│   └── images/          # Post images, avatar, logo
├── index.html           # Homepage
├── Gemfile              # Ruby dependencies
└── .gitignore
```

## Adding New Projects

Create a new file in `_posts/` with the format `YYYY-MM-DD-title.md`:

```yaml
---
layout: post
title: "Your Project Title"
author: jn9he
categories: [Statistics]  # or [Data-Science] or [Design]
tags: [r, regression, visualization]
image: assets/images/your-image.png
tools: [R, ggplot2, tidyverse]
description: "Brief description of the project."
---

Your content here...
```

## Deployment

Push to the `main` branch — GitHub Pages will build and deploy automatically.

## Credits

- Theme: [Mundana](https://github.com/codebygina/mundana-theme-jekyll) by WowThemes.net
- Framework: [Jekyll](https://jekyllrb.com/)
- Hosting: [GitHub Pages](https://pages.github.com/)
