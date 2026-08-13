---
title: "Sentiment Analysis Pipelines"
date: "08/2026"
category: "Data Science"
thumbnail: "/images/sentiment-pipelines-01.png"
description: "Three distinct sentiment analysis pipelines built at Spectrum, each trading off differently between context depth, interpretability, and structured output."
images:
  - "/images/sentiment-pipelines-01.png"
links:
  - label: "GitHub Repo"
    url: "https://github.com/jn9he/hybrid-rag-pipeline"
---

## Overview

Built and compared three separate approaches to sentiment analysis on long-form transcripts, each suited to a different constraint — context length, prediction control, or downstream modeling needs.

## Tech Stack

Python, foundation model APIs (LLM), hybrid RAG retrieval (HyDE, agglomerative clustering), gradient boosting (GBM).

## 1. Hybrid RAG Pipeline

Combines hybrid embeddings, dynamic query generation (HyDE), and agglomerative tree clustering to retrieve more relevant context from long transcripts before scoring sentiment.

## 2. LLM Driver Pipeline

Uses a foundation model directly for sentiment analysis, with separate prompt engineering strategies designed to shape and optimize the model's prediction distribution.

## 3. LLM + GBM Pipeline

Uses a foundation model with prompt engineering to extract 26 concrete numerical parameters from each transcript, which then feed a traditional gradient boosting model for the final sentiment prediction — combining LLM reasoning with a more interpretable, tunable downstream classifier.

## Evaluation

Scored each pipeline's predicted sentiment distribution against ground truth using KL divergence and Jensen-Shannon divergence, giving a quantitative measure of how closely each pipeline tracked the true sentiment distribution.
