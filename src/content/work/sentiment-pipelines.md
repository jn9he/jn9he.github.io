---
title: "Sentiment Analysis Pipelines"
date: "06/2026"
category: "Data Science"
thumbnail: "/images/project-cobalt.jpg"
description: "Three distinct sentiment analysis pipelines built at Spectrum, each trading off differently between context depth, interpretability, and structured output."
images:
  - "/images/gallery-01.jpg"
  - "/images/gallery-02.jpg"
  - "/images/gallery-03.jpg"
---

## Overview

Built and compared three separate approaches to sentiment analysis on long-form transcripts, each suited to a different constraint — context length, prediction control, or downstream modeling needs.

## 1. Hybrid RAG Pipeline

Combines hybrid embeddings, dynamic query generation (HyDE), and agglomerative tree clustering to retrieve more relevant context from long transcripts before scoring sentiment.

## 2. LLM Driver Pipeline

Uses a foundation model directly for sentiment analysis, with separate prompt engineering strategies designed to shape and optimize the model's prediction distribution.

## 3. LLM + GBM Pipeline

Uses a foundation model with prompt engineering to extract 26 concrete numerical parameters from each transcript, which then feed a traditional gradient boosting model for the final sentiment prediction — combining LLM reasoning with a more interpretable, tunable downstream classifier.
