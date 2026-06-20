import os
from dotenv import load_dotenv

# FORCE correct path
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../../.env"))

from groq import Groq

print("GROQ KEY:", os.getenv("GROQ_API_KEY"))

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def extract_task(task_text: str):

    prompt = """
You are a task extraction AI.

Extract structured JSON ONLY:

{
  "title": "...",
  "priority": "low/medium/high",
  "tags": [],
  "deadline": null
}

Task:
""" + task_text

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        return {
            "result": response.choices[0].message.content
        }

    except Exception as e:
        return {
            "error": str(e)
        }