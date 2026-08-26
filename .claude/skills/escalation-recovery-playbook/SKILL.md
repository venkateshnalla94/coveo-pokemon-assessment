---
name: escalation-recovery-playbook
description: Template and structure for the Topic 2 panel presentation — Escalation & Recovery operational scenario. Use when drafting or reviewing presentation/topic2-escalation-recovery.md.
---

# Escalation & Recovery playbook

Scenario given in the assessment: a large customer's search platform is intermittently failing under peak traffic and reporting rapid business impact. The presentation must cover four things, in this order:

## 1. Root-cause analysis approach

How would you actually investigate this — not the answer, the *method*. Consider: what telemetry/dashboards would you pull first (query latency, error rates, index freshness, org-level rate limits), how you'd correlate "intermittent" + "peak traffic" (points toward capacity/throttling/rate-limiting rather than a hard config bug), and how you'd distinguish a Coveo-platform-side issue from a customer-integration-side issue (e.g. their frontend hammering the Search API without caching, or a misconfigured query pipeline).

## 2. Short-term remediation plan

What stabilizes the customer *today*, before root cause is fully confirmed. Options to consider: query caching, backoff/retry tuning on the client, temporary rate-limit increases, disabling an expensive feature (e.g. an ML model or heavy query pipeline stage) under load, or failover/traffic shaping. State explicitly what you'd do first and why it's safe to do without full RCA.

## 3. Communications to executives

Write this as an actual communication, not a description of one. Should be short, non-technical, and answer: what's broken, who's affected, what's being done right now, and when's the next update. Draft the literal message text in the presentation file.

## 4. Plan to prevent recurrence

Distinguish immediate follow-ups (post-incident review, alerting gaps closed) from structural changes (capacity planning, load testing before peak events, SLA/quota conversations with the customer). Tie back to whatever the RCA in step 1 actually found — don't propose generic "add more monitoring" without connecting it to the specific failure mode discussed.

## Delivery notes

This is an operational-leadership exercise — the panel is evaluating judgment and communication, not code. Keep it to content that fits ~20 minutes with room for Q&A.
