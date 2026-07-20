---
layout: post
title: "Predicting Customer Churn with Machine Learning"
author: jn9he
categories: [Data-Science]
tags: [python, machine-learning, classification, pandas]
image: assets/images/post-churn.svg
tools: [Python, scikit-learn, pandas, matplotlib]
description: "Building a gradient-boosted classifier to predict telecom customer churn, achieving 89% accuracy with interpretable feature importance."
---

## Overview

Customer churn prediction is a critical business problem — acquiring new customers costs 5-7x more than retaining existing ones. In this project, I built an end-to-end machine learning pipeline to identify customers likely to leave a telecom provider.

## The Data

The dataset contains 7,043 customer records with 21 features including:
- Demographics (gender, senior citizen, partner, dependents)
- Account info (tenure, contract type, payment method)
- Services (phone, internet, streaming, tech support)
- Monthly and total charges

## Approach

### 1. Exploratory Data Analysis

Initial exploration revealed key patterns:
- Month-to-month contracts have **3x higher churn** than annual contracts
- Customers without tech support churn at significantly higher rates
- Tenure is strongly negatively correlated with churn

```python
import pandas as pd
import seaborn as sns

df = pd.read_csv('telecom_churn.csv')
churn_by_contract = df.groupby('Contract')['Churn'].mean()
print(churn_by_contract)
```

### 2. Feature Engineering

- Encoded categorical variables using one-hot encoding
- Created interaction terms (tenure × monthly charges)
- Normalized continuous features with StandardScaler

### 3. Model Selection

Compared multiple classifiers:

| Model | Accuracy | Precision | Recall | F1 |
|-------|----------|-----------|--------|-----|
| Logistic Regression | 0.80 | 0.67 | 0.54 | 0.60 |
| Random Forest | 0.85 | 0.74 | 0.63 | 0.68 |
| **Gradient Boosting** | **0.89** | **0.82** | **0.71** | **0.76** |

### 4. Feature Importance

The top predictors of churn were:
1. Contract type (month-to-month)
2. Tenure (shorter = higher risk)
3. Monthly charges (higher = higher risk)
4. Lack of tech support
5. Fiber optic internet (correlated with higher charges)

## Results

The final Gradient Boosting model achieved **89% accuracy** and **0.76 F1-score** on the holdout test set. This model enables targeted retention campaigns for high-risk customers.

## Key Takeaways

- Feature engineering and domain understanding matter more than model complexity
- Class imbalance required SMOTE oversampling for better recall
- Interpretability via SHAP values helps stakeholders trust the model

## Tools Used

Python, pandas, scikit-learn, matplotlib, seaborn, SHAP
