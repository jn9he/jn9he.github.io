---
title: "FP&A Dashboard"
date: "05/2026"
category: "Data Science"
thumbnail: "/images/fpa-dashboard-01.png"
description: "Proof-of-concept labor and AWS cost planning tool built at Spectrum, backed by an automated cloud cost data pipeline."
images:
  - "/images/fpa-dashboard-01.png"
  - "/images/fpa-dashboard-02.png"
  - "/images/fpa-dashboard-03.png"
  - "/images/fpa-dashboard-04.png"
links:
  - label: "GitHub Repo"
    url: "https://github.com/jn9he/fpa-aws-dashboard"
---

## Overview

A proof-of-concept planning tool for FP&A, giving stakeholders visibility into labor costs alongside AWS spend to support budgeting decisions.

## Tech Stack

React, Vite, LangChain, AWS Glue, AWS Lambda, AWS Cost and Usage Report (CUR), Amazon S3.

## Approach

- Built the front end with React and Vite, covering executive summary, labor cost, and AWS forecast views.
- Used LangChain to power "Ask Robert," an in-app AI assistant that surfaces and summarizes cost data in response to natural-language questions.
- Assembled a data pipeline on AWS Glue, AWS Lambda, and the AWS Cost and Usage Report (CUR), landing data in S3 for downstream use.
- Built a scenario planner for modeling headcount and project changes against labor budget impact in real time.

## Status

Proof of concept, built to validate the approach for labor and cloud cost planning before further investment.
