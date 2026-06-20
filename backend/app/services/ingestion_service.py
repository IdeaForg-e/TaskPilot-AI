def ingest_task(data: dict):
    """
    Simple ingestion layer:
    - validates raw input
    - passes clean data forward
    """

    if not data.get("task"):
        return {"error": "task is required"}

    return {
        "task": data["task"],
        "priority": data.get("priority", "medium")
    }

