# Fed Rate Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a mobile-first public dashboard showing next FOMC rate probabilities and four macro indicators with historical charts.

**Architecture:** Next.js on Vercel with Provider abstraction (calculated / official / mock). FRED for indicators; CME settlements for calculated probabilities; official CME API reserved for later.

**Tech Stack:** Next.js 16, Tailwind CSS 4, SWR, Lightweight Charts, FRED API

---

## Completed Tasks

- [x] Scaffold Next.js app with Tailwind
- [x] Implement FRED client and indicator APIs
- [x] Implement CME settlement fetch + FedWatch calculation
- [x] Implement Provider abstraction (calculated / official / mock)
- [x] Build API routes with caching
- [x] Build mobile-first dashboard UI
- [x] Add degraded fallback when CME unavailable
- [x] Write README and design spec

## Deploy Checklist

- [ ] Push to GitHub
- [ ] Import to Vercel (shijie906847474@gmail.com)
- [ ] Set `FRED_API_KEY` and `FEDWATCH_PROVIDER=calculated`
- [ ] Verify live `/api/fedwatch` returns real CME data on Vercel
