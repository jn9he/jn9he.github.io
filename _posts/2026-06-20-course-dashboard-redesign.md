---
layout: post
title: "Redesigning a University Course Dashboard"
author: jn9he
categories: [Design]
tags: [ui-ux, figma, data-visualization, user-research]
image: assets/images/post-dashboard.svg
tools: [Figma, D3.js, HTML/CSS, User Interviews]
description: "A UI/UX case study on redesigning an academic dashboard to help students track progress, visualize grades, and plan coursework."
---

## Overview

University course management systems are often cluttered, confusing, and built for administrators rather than students. In this project, I redesigned the student-facing course dashboard for my university, focusing on clarity, data visualization, and task-oriented workflows.

## The Problem

Through user interviews with 12 undergraduate students, I identified key pain points:
- **Information overload** — everything displayed at once with no hierarchy
- **Poor grade visibility** — students couldn't easily see where they stood
- **No progress tracking** — unclear how current grades translated to final outcomes
- **Bad mobile experience** — unusable on phones (where 73% of students access it)

## Research & Discovery

### User Interviews

Key quotes from students:
> "I have to do mental math every time to figure out my current grade."  
> "I can never find the right assignment — they're all just listed chronologically."  
> "I wish I could see at a glance which classes need my attention."

### Competitive Analysis

I analyzed 5 leading LMS platforms (Canvas, Blackboard, Moodle, Google Classroom, Notion for Education) to identify best practices:
- Progressive disclosure of information
- Visual grade breakdowns
- Clear assignment status indicators

## Design Process

### Information Architecture

Reorganized content into three primary views:
1. **Dashboard** — overview with at-a-glance status per course
2. **Course Detail** — grades, assignments, and resources for one course
3. **Planner** — upcoming deadlines across all courses

### Wireframes

Started with low-fidelity wireframes to test layout concepts:
- Card-based dashboard with progress rings
- Grade breakdown using stacked bar charts
- Color-coded urgency indicators

### Visual Design

Design decisions driven by the data:
- **Progress rings** show percentage toward final grade (intuitive at a glance)
- **Spark lines** show grade trajectory over time
- **Color system:** green (on track), yellow (attention needed), red (at risk)
- **Typography:** Clear hierarchy with Inter for UI and tabular numbers for grades

### Accessibility

- WCAG 2.1 AA compliant color contrast ratios
- Tested with screen readers (VoiceOver, NVDA)
- Keyboard-navigable interface
- Alternative text for all data visualizations

## Prototype

Built an interactive prototype in Figma with:
- 15 unique screens
- Responsive breakpoints (desktop, tablet, mobile)
- Micro-interactions for grade updates and assignment submissions
- Dark mode variant

## Usability Testing

Tested with 8 students (different from the interview group):

| Metric | Before | After |
|--------|--------|-------|
| Time to find current grade | 47s avg | 8s avg |
| Task completion (check upcoming) | 62% | 96% |
| System Usability Scale (SUS) | 41 | 82 |
| Mobile task success rate | 38% | 91% |

## Key Takeaways

- **Data visualization in UI** is not just decoration — well-designed progress indicators reduced cognitive load by 83%
- **Mobile-first** design was essential given actual usage patterns
- **Statistics informed design decisions** — usage analytics and task timing guided iteration priorities
- **Accessibility is not optional** — color-blind safe palettes and screen reader testing caught issues early

## Tools Used

Figma, D3.js, HTML/CSS, Adobe Illustrator, user interview transcription
