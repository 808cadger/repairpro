"""agents/decision_agent.py — confidence scoring and QA review"""
# Aloha from Pearl City! 🌺

import json
import re
from typing import Any

from backend.utils.claude_client import call_claude

SYSTEM_PROMPT = (
    "You are a senior QA manager at an insurance claims center. Review pipeline output. "
    "Score confidence 0-100. Set human_review_flag=true if confidence<70 OR cost>$5000 "
    "OR photo_quality=poor OR prior_repair_indicators. Return ONLY valid JSON."
)


async def run(
    vision_result: dict[str, Any],
    parts_result: list[dict[str, Any]],
    pricing_result: dict[str, Any],
    vehicle: dict[str, Any],
) -> dict[str, Any]:
    v_desc = f"{vehicle.get('year', '')} {vehicle.get('make', '')} {vehicle.get('model', '')}"

    prompt = (
        f"Review pipeline output for a {v_desc}.\n\n"
        f"VISION:\n{json.dumps(vision_result, indent=2)}\n\n"
        f"PARTS:\n{json.dumps(parts_result, indent=2)}\n\n"
        f"PRICING:\n{json.dumps(pricing_result, indent=2)}\n\n"
        'Return ONLY JSON: {"confidence_score":N,"human_review_flag":bool,'
        '"review_reasons":[],"executive_summary":"<one sentence>",'
        '"pipeline_warnings":[],"disclaimer":"Preliminary estimate only."}'
    )

    raw = await call_claude(
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": [{"type": "text", "text": prompt}]}],
        model="claude-sonnet-4-6",
        max_tokens=500,
    )

    match = re.search(r"\{[\s\S]*\}", raw)
    if not match:
        raise ValueError("Decision agent: no JSON")
    result: dict[str, Any] = json.loads(match.group())

    # Programmatic safety net
    confidence = float(result.get("confidence_score", 0))
    total_high = (pricing_result.get("total") or {}).get("high", 0)
    photo_qual = vision_result.get("photo_quality", "good")
    prior_rep = vision_result.get("prior_repair_indicators", False)

    if confidence < 70 or total_high > 5000 or photo_qual == "poor" or prior_rep:
        result["human_review_flag"] = True

    return result
