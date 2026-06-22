FUSION_PROMPT = """You are a semantic fusion agent. Decide if two tasks are the same unit of work across systems (Jira, GitHub, Slack, email, incidents, meeting notes).

Task A — Title: {title_a} | Description: {desc_a}
Task B — Title: {title_b} | Description: {desc_b}

Merge when: same real-world outcome (Jira feature + its PR, incident + Slack alert about it, meeting action + email follow-up for same deliverable).
Do NOT merge when: one is a dependency of the other, one is a post-completion follow-up, same product area but different outcomes.

Confidence: 0.0–1.0. Only mark duplicate when confidence is high enough a manager would want one card.
If not duplicate, return best title/description from the stronger task.

Return JSON only:
{"is_duplicate":true,"confidence":0.0,"merged_title":"...","merged_description":"..."}"""
