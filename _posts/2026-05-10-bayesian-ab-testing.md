---
layout: post
title: "Bayesian Analysis of A/B Testing Results"
author: jn9he
categories: [Statistics]
tags: [r, bayesian, ab-testing, hypothesis-testing]
image: assets/images/post-bayesian.svg
tools: [R, Stan, ggplot2, tidyverse]
description: "Applying Bayesian inference to analyze conversion rate experiments, providing richer insights than traditional frequentist p-values."
---

## Overview

Traditional A/B testing relies on p-values and confidence intervals, which are often misinterpreted. In this project, I applied Bayesian methods to analyze a website conversion experiment, providing posterior probability distributions that directly answer the business question: "What's the probability that variant B is better?"

## The Problem

A company ran an A/B test on their landing page:
- **Control (A):** Original page design — 1,243 visitors, 97 conversions
- **Treatment (B):** New design — 1,189 visitors, 116 conversions

The frequentist test gives p = 0.042. But what does that really tell us?

## Bayesian Approach

### Prior Specification

I used a weakly informative Beta(1, 1) prior (uniform) for both conversion rates, letting the data speak:

```r
library(rstan)

# Data
n_a <- 1243; y_a <- 97
n_b <- 1189; y_b <- 116

# Beta-Binomial conjugate model
alpha_prior <- 1; beta_prior <- 1

# Posterior parameters
alpha_a <- alpha_prior + y_a    # 98
beta_a  <- beta_prior + n_a - y_a  # 1147

alpha_b <- alpha_prior + y_b    # 117
beta_b  <- beta_prior + n_b - y_b  # 1074
```

### Posterior Distributions

```r
library(ggplot2)
library(tidyverse)

# Sample from posteriors
set.seed(42)
n_samples <- 100000
theta_a <- rbeta(n_samples, alpha_a, beta_a)
theta_b <- rbeta(n_samples, alpha_b, beta_b)

# Probability B > A
prob_b_better <- mean(theta_b > theta_a)
cat("P(B > A) =", prob_b_better)
# P(B > A) = 0.978
```

### Results

| Metric | Control (A) | Treatment (B) |
|--------|------------|---------------|
| Observed rate | 7.8% | 9.8% |
| Posterior mean | 7.9% | 9.8% |
| 95% Credible Interval | [6.4%, 9.5%] | [8.2%, 11.6%] |

**P(B > A) = 97.8%** — We can be very confident the new design improves conversions.

### Lift Distribution

```r
lift <- (theta_b - theta_a) / theta_a
cat("Expected lift:", round(mean(lift) * 100, 1), "%")
cat("95% CI for lift:", round(quantile(lift, c(0.025, 0.975)) * 100, 1), "%")
# Expected lift: 25.3%
# 95% CI: [2.1%, 53.8%]
```

## Why Bayesian?

1. **Direct probability statements** — "97.8% probability B is better" vs. "reject null at α = 0.05"
2. **Quantified uncertainty on effect size** — full distribution of the lift
3. **No multiple comparison penalty** for continuous monitoring
4. **Intuitive decision-making** — stakeholders understand probabilities

## Key Takeaways

- Bayesian methods complement frequentist approaches and often provide more actionable conclusions
- Conjugate priors (Beta-Binomial) make computation trivial for conversion rate experiments
- The posterior predictive distribution can inform expected revenue impact

## Tools Used

R, Stan, ggplot2, tidyverse, bayesplot
