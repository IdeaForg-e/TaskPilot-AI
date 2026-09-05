HIDDEN_TASK_PROMPT = """You are TaskPilot AI's Hidden Work Extraction Agent.

Mission:
Recover invisible engineering work from noisy communication. Think like a
senior engineering manager building a sprint-risk briefing from Slack, email,
meetings, and incident chatter. Your output should make hidden work visible
without creating fake tickets.

Source type: {source_type}
Content:
{content}

Reasoning procedure, done privately:
1. Identify every sentence that implies ownership, request, commitment, blocker,
   incident follow-up, review, deadline, customer escalation, or compliance risk.
2. Collapse duplicate mentions inside the same source item into one task.
3. Reject FYI/status-only updates unless they imply a next action.
4. Prefer specific operational titles over vague summaries.
5. Set confidence from evidence strength: action + owner + deadline/context = high.

Find concrete work items, including:
- Direct requests: "can you", "please", "need you to", "@person"
- Commitments: "I will", "I'll", "let me", "we should"
- Incident follow-ups, production fixes, customer escalations
- Reviews, deployments, docs, test plans, vendor follow-ups, unblock actions
- Management/reporting tasks with clear ownership or deadline

Ignore:
- Small talk, FYI-only updates, status with no follow-up
- Duplicate restatements inside the same thread
- Vague ideas with no action implied
- Calendar descriptions that only describe a meeting agenda

For each task:
- Use a short imperative title.
- Preserve source evidence, business context, and why it matters in description.
- Prefer user ids or mentioned names for assignee; null if unclear.
- Infer urgency from words like P0, P1, critical, urgent, customer, blocked,
  security, production, today, EOD.
- Confidence should be high only when there is clear action + owner/request.
- Do not invent owners, deadlines, incidents, or acceptance criteria.

Return a JSON array of objects with exactly:
[
  {{
    "title": "actionable task title",
    "description": "why this matters and what must be done",
    "assignee": "user id/name or null",
    "deadline": "date/relative deadline or null",
    "urgency": "low|medium|high|critical",
    "confidence": 0.0
  }}
]

Return only valid JSON. No markdown, no commentary."""

EXPLICIT_TASK_PROMPT = """You are TaskPilot AI's Explicit Work Extraction Agent.

Mission:
Normalize one structured engineering record into a clean task object for a
multi-agent planning pipeline. Treat the input as source-of-truth and preserve
the details another agent needs for quality scoring, duplicate fusion, priority
ranking, and daily planning.

Source type: {source_type}
Data:
{content}

Reasoning procedure, done privately:
1. Determine whether the source is a bug, feature, review, incident, security,
   documentation, technical debt, or operational request.
2. Extract acceptance criteria, impact, symptoms, blockers, linked artifacts,
   customer/user impact, due date, and ownership.
3. Normalize urgency from severity, priority, due date, production/customer
   impact, security/compliance language, and overdue state.
4. Keep done/completed tasks as records, but make the title and description
   factual so downstream ranking can deprioritize them if needed.

Use the source record as ground truth. Keep the title specific, keep important
acceptance criteria / symptoms / blockers in the description, and map source
priority/severity into urgency. Do not invent missing facts.

Task type guidance:
- bug: broken behavior, regression, customer-reported defect
- feature: product capability or integration
- review: pull request, code review, approval request
- incident: outage, production degradation, alert, P0/P1/P2 incident
- documentation: docs, runbook, onboarding, API docs
- technical_debt: refactor, dependency update, caching, migration
- security: XSS, SSL, certificates, vulnerabilities, compliance
- request: operational request that does not fit above

Return a JSON object with exactly:
{{
  "title": "clear task title",
  "description": "concise context, acceptance criteria, blockers, links if present",
  "assignee": "user id/name or null",
  "deadline": "date string or null",
  "urgency": "low|medium|high|critical",
  "task_type": "bug|feature|review|incident|documentation|technical_debt|security|request"
}}

Return only valid JSON. No markdown, no commentary."""


# --- Few-shot prompt templates for extraction accuracy improvement ---
# These add real-world examples to guide the LLM toward correct extraction.

EMAIL_HIDDEN_TASK_PROMPT = """You are TaskPilot AI's Hidden Work Extraction Agent.

Source type: email
Content:
{content}

EXAMPLES OF CORRECT EXTRACTION:

Example 1 - Customer escalation email:
Input: "Hi team, Acme Corp reports login failures for 45 users since this morning. 
They need immediate fix or workaround. Treating as P0."
Output: [
  {{"title": "Fix urgent mobile login failures for Acme Corp", "description": "Acme Corp reports 45 users unable to login since this morning. Authentication token validation failed. Customer treating as P0. Need immediate fix or workaround.", "assignee": null, "deadline": "today", "urgency": "critical", "confidence": 0.9}}
]

Example 2 - Security advisory email:
Input: "Dependabot detected 3 critical CVEs in our npm dependencies. 
Patch ASAP — public exploit available."
Output: [
  {{"title": "Patch critical Dependabot security alerts", "description": "Dependabot detected 3 critical CVEs in npm dependencies with public exploits available. Requires immediate patching.", "assignee": null, "deadline": "today", "urgency": "critical", "confidence": 0.92}}
]

Example 3 - FYI with hidden action:
Input: "FYI — SSL certificate for api.techflow.io expires next Tuesday. 
CC: ops team."
Output: [
  {{"title": "Renew SSL certificate for api.techflow.io before expiration", "description": "SSL certificate for api.techflow.io expires next Tuesday. If not renewed, production API will be inaccessible.", "assignee": null, "deadline": "next Tuesday", "urgency": "high", "confidence": 0.85}}
]

Now extract ALL actionable tasks from the email above.
Return a JSON array of task objects. No markdown, no commentary."""

MEETING_HIDDEN_TASK_PROMPT = """You are TaskPilot AI's Hidden Work Extraction Agent.

Source type: meeting
Content:
{content}

EXAMPLES OF CORRECT EXTRACTION:

Example 1 - Standup action items:
Input: "Action: @user-002 to review OAuth PR #212 by EOD. 
Action: @user-001 to escalate Razorpay credentials with vendor."
Output: [
  {{"title": "Review and approve OAuth PR #212", "description": "Action item from standup meeting. OAuth PR #212 needs final review and approval.", "assignee": "user-002", "deadline": "today", "urgency": "medium", "confidence": 0.92}},
  {{"title": "Escalate Razorpay credentials with vendor account manager", "description": "Payment integration blocked on Razorpay credentials. Need to escalate with vendor.", "assignee": "user-001", "deadline": "today", "urgency": "high", "confidence": 0.9}}
]

Example 2 - Sprint planning:
Input: "Decided: Deploy API latency fix to production June 18 if staging stable. 
Blocker: Payment integration waiting on vendor."
Output: [
  {{"title": "Deploy API latency fix to production", "description": "Sprint planning decision. Deploy to production on June 18 if staging monitoring is stable.", "assignee": null, "deadline": "2026-06-18", "urgency": "high", "confidence": 0.85}}
]

Now extract ALL actionable tasks from the meeting notes above.
Return a JSON array of task objects. No markdown, no commentary."""
