PRIORITY_PROMPT = """You are a task prioritization agent. Score the task below.

Title: {title}
Description: {description}
Urgency: {urgency}
Deadline: {deadline}
Source Count: {source_count}
Task Type: {task_type}
Input Quality Score: {quality_score}

Scores (0.0–10.0):
- severity_score: technical urgency / incident severity
- deadline_score: urgency of deadline (EOD/today = high)
- production_impact_score: infra/business impact (outage/DB lockup = 10.0)
- customer_impact_score: direct customer-facing degradation
- dependency_score: complexity from source signals/connections
- blocker_score: blocking CI, missing credentials, SSL expiry
- business_impact_score: max(customer_impact, production_impact)
- quality_factor_score: quality_score / 10

Formula: overall_score = (severity×0.25) + (production_impact×0.20) + (customer_impact×0.18) + (deadline×0.12) + (blocker×0.10) + (business_impact×0.10) + (quality_factor×0.05)
Multipliers (apply if triggered):
- Vague title (short/generic like "fix this today","include:","be a quick fix"): ×0.55
- Admin/reporting work (roadmap review, sprint retro, management report): ×0.72

explanation: 2–3 sentence paragraph on why this score. No bullet points, no score listing.

Return JSON only:
{"overall_score":0.0,"severity_score":0.0,"deadline_score":0.0,"production_impact_score":0.0,"customer_impact_score":0.0,"dependency_score":0.0,"blocker_score":0.0,"business_impact_score":0.0,"quality_factor_score":0.0,"explanation":"..."}"""


BATCH_PRIORITY_PROMPT = """You are a task prioritization agent. Score each task in the list below.

Tasks: {tasks_json}

For each task, calculate (0.0–10.0):
- severity_score: technical urgency / incident severity
- deadline_score: deadline urgency (EOD/today = high)
- production_impact_score: infra/business impact (outage/DB lockup = 10.0)
- customer_impact_score: direct customer-facing degradation
- dependency_score: complexity from source signals/connections
- blocker_score: blocking CI, missing credentials, SSL expiry
- business_impact_score: max(customer_impact, production_impact)
- quality_factor_score: quality_score / 10

Formula: overall_score = (severity×0.25) + (production_impact×0.20) + (customer_impact×0.18) + (deadline×0.12) + (blocker×0.10) + (business_impact×0.10) + (quality_factor×0.05)
Multipliers:
- Vague title (short/generic like "fix this today","include:","be a quick fix"): ×0.55
- Admin/reporting (roadmap review, sprint retro, management report): ×0.72

explanation: 2–3 sentence paragraph per task. No bullets, no score listing.

Return JSON only:
{"scores":{"task_id_1":{"overall_score":0.0,"severity_score":0.0,"deadline_score":0.0,"production_impact_score":0.0,"customer_impact_score":0.0,"dependency_score":0.0,"blocker_score":0.0,"business_impact_score":0.0,"quality_factor_score":0.0,"explanation":"..."}}}"""
