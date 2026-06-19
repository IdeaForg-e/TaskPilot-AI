import json

def agent1_extract(task_text):
    if not task_text or task_text.strip() == "":
        return {
            "original_text": task_text,
            "task": None,
            "priority": "low",
            "actionable": False,
            "flags": ["empty_input"],
            "reason": "Input is empty or invalid"
        }

    text = task_text.lower().strip()

    result = {
        "original_text": task_text,
        "task": task_text.strip(),
        "priority": "medium",
        "actionable": True,
        "flags": [],
        "reason": ""
    }

    vague_words = ["maybe", "something", "somehow", "issue", "problem", "fix it", "etc"]

    if any(word in text for word in vague_words):
        result["flags"].append("vague_task")

    if "urgent" in text or "asap" in text:
        result["priority"] = "high"

    if len(task_text.strip()) < 5:
        result["actionable"] = False
        result["flags"].append("too_short")

    if result["flags"]:
        result["reason"] = "Detected issues: " + ", ".join(result["flags"])
    else:
        result["reason"] = "Task is clear and actionable"

    return result


output = agent1_extract("Fix login issue maybe urgent ASAP")

# 🔥 THIS IS THE IMPORTANT PART
print(json.dumps(output, indent=2))