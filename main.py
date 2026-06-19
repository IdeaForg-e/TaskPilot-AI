from fastapi import FastAPI

app = FastAPI()

def agent1_extract(task_text):
    text = task_text.lower()

    result = {
        "original_text": task_text,
        "task": task_text,
        "priority": "medium",
        "actionable": True,
        "flags": [],
        "reason": ""
    }

    vague_words = ["maybe", "something", "issue", "problem", "fix it", "asap"]

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


@app.get("/")
def home():
    return {"message": "Agent 1 API is running"}

@app.get("/extract")
def extract(task: str):
    return agent1_extract(task)