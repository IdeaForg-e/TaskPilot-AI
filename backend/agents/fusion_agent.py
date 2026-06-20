
import os
import json
from groq import Groq
from dotenv import load_dotenv
from agents.prompts.fusion_prompts import FUSION_PROMPT

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def run_fusion(data: dict):

    prompt = FUSION_PROMPT.format(data=data)

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    content = response.choices[0].message.content

    # SAFE JSON PARSING (IMPORTANT)
    try:
        return json.loads(content)
    except Exception:
        return {
            "raw_output": content,
            "warning": "Model did not return valid JSON"
        }