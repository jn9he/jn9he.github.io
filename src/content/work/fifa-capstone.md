---
title: "FIFA Player Market Statistics"
date: "03/2026"
category: "Statistics"
thumbnail: "/images/player-market-01.png"
description: "Capstone analysis of FIFA player and market data, identifying undervalued players and evaluating clubs by acquisition efficiency."
images:
  - "/images/player-market-01.png"
links:
  - label: "Read the Paper"
    url: "https://github.com/jn9he/player-market/blob/main/Player%20Market%20Prediction%20Final%20Paper.pdf"
  - label: "GitHub Repo"
    url: "https://github.com/jn9he/player-market"
---

## Overview

A capstone project analyzing a combined dataset of 90+ attributes across 100k+ player records to study market value in professional football.

## Tech Stack

Python, Pandas, Scikit-learn (SVM, Random Forest), XGBoost, Matplotlib.

## Approach

- Trained and compared SVM, XGBoost, and Random Forest models against player attributes and market value, evaluating fit with residual and Q-Q diagnostics.
- Ranked feature importance separately by position (defenders, midfielders, attackers) to surface which attributes most influence market value.
- Built a player-level analysis to identify players who are significantly undervalued relative to their attributes, for each position.
- Built a team-level analysis to evaluate football clubs by the efficiency of their player acquisitions.

## Outcomes

- Produced a ranked view of undervalued players by position.
- Produced a club-level efficiency metric for evaluating transfer/acquisition strategy.
