# Reincrew AI Interview Platform Capacity Analysis Report

This report summarizes the capacity limits, latency bottlenecks, failure rates, and AI financial costs discovered during progressive load testing.

## Executive Summary

- **Maximum Sustainable Capacity**: **10 concurrent users**
- **Primary Bottleneck**: Capacity collapsed at 25 users due to: DB P95 Latency too high (5900.0ms > 5000.0ms).

> [!NOTE]
> A tier is considered **sustainable** only if the total error rate is less than 1%, average database write/read latency remains under 2 seconds, and average AI response evaluation latency remains under 15 seconds.

---

## 1. Load Tier & Latency Metrics

| Users | Status | DB Latency (Avg/P95) | AI Latency (Avg/P95) | Peak Concurrent AI | Interview Duration (Avg/P95) |
|---|---|---|---|---|---|
| 10 | ✅ HEALTHY | 400.0ms / 2000.0ms | 1.17s / 1.50s | 7 | 14.0 sec / 27.6 sec |
| 25 | ❌ DEGRADED | 974.0ms / 5900.0ms | 1.13s / 1.50s | 14 | 25.1 sec / 41.8 sec |
| 50 | ❌ DEGRADED | 1174.3ms / 8500.0ms | 1.15s / 1.50s | 26 | 33.8 sec / 1 min 6.9 sec |
| 100 | ❌ DEGRADED | 1513.1ms / 20000.0ms | 1.16s / 1.50s | 31 | 45.5 sec / 1 min 30.0 sec |
| 200 | ❌ DEGRADED | 1598.4ms / 13000.0ms | 1.15s / 1.50s | 128 | 45.8 sec / 1 min 47.0 sec |

---

## 2. Request Errors & Supabase Status Codes

| Users | Total Requests | Failed Requests | Overall Error Rate | Supabase HTTP Failure Breakdown |
|---|---|---|---|---|
| 10 | 191 | 0 | 0.00% | None |
| 25 | 544 | 0 | 0.00% | None |
| 50 | 1228 | 0 | 0.00% | None |
| 100 | 2832 | 16 | 0.56% | other:16 |
| 200 | 7290 | 39 | 0.53% | other:39 |

---

## 3. OpenRouter AI Financial & Token Summary

*Costs calculated in Indian Rupees (₹) assuming 1 USD = ₹83.0. Default pricing uses DeepSeek-Chat ($0.14/1M input tokens, $0.28/1M output tokens).*

| Users | Total AI Calls | Prompt / Completion Tokens | Total Cost (INR) | Avg Cost per Completed Interview |
|---|---|---|---|---|
| 10 | 75 | 79,336 / 7,725 | ₹1.10 | ₹0.14 |
| 25 | 219 | 225,246 / 22,557 | ₹3.14 | ₹0.14 |
| 50 | 479 | 491,654 / 49,337 | ₹6.86 | ₹0.11 |
| 100 | 1134 | 1,135,539 / 116,802 | ₹15.91 | ₹0.12 |
| 200 | 2907 | 2,919,898 / 299,421 | ₹40.89 | ₹0.11 |

---

## 4. Key Findings & Recommendations

### Database Performance
Supabase operations began degrading under higher loads, leading to transaction slowdowns or HTTP 500 errors.
Ensure that your database indices are properly set on:
- `candidates.email`
- `interview_sessions.candidate_id`
- `session_responses.session_id`

### AI Concurrency & Rate Limits
If 429 errors or timeouts were encountered, it indicates hitting the concurrent request limits of either OpenRouter or the underlying provider (DeepSeek).
To prevent these limits from blocking users:
1. **Model Fallback**: Implement automated failover to alternate endpoints (e.g. Gemini-2.5-Flash or Claude-3.5-Haiku) if DeepSeek-Chat returns a 429 or 5xx.
2. **Provider Tier Upgrades**: Upgrade your OpenRouter account or purchase throughput tier commitments.

### Financial Control
AI Cost Tracking shows that the cost per interview is a function of total token volume. Using the exact production evaluation prompt results in high token usage. If the cost per interview is too high, consider:
- Shortening the internal evaluation rubric.
- Using a cheaper model (like `gemini-2.5-flash-lite` or `deepseek-flash`) for intermediate question evaluations, and reserving higher-tier models for the final report check.
