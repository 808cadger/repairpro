"""agents/pricing_agent.py — repair cost estimation"""
# Aloha from Pearl City! 🌺

import json
import re
from typing import Any

from backend.utils.claude_client import call_claude

SYSTEM_PROMPT = (
    "You are a certified automotive estimator. Generate repair cost estimates. "
    "Provide low/mid/high ranges for parts, labor (hours x rate), and paint. "
    "Hawaii indie shop rates: $110-150/hr. Return ONLY valid JSON."
)


async def run(parts_result: list[dict[str, Any]], vehicle: dict[str, Any]) -> dict[str, Any]:
    v_desc = f"{vehicle.get('year', '')} {vehicle.get('make', '')} {vehicle.get('model', '')}"

    parts_text = "\n".join(
        f"{i+1}. {p['part_name']} — {p['repair_action']} ({p.get('parts_source', '?')})"
        for i, p in enumerate(parts_result)
    )

    prompt = (
        f"Cost estimate for a {v_desc}.\n\nParts:\n{parts_text}\n\n"
        'Return ONLY JSON: {"parts":{"low":N,"mid":N,"high":N},'
        '"labor":{"hours":N,"rate":110,"low":N,"mid":N,"high":N},'
        '"paint":{"low":N,"mid":N,"high":N},'
        '"total":{"low":N,"mid":N,"high":N}}'
    )

    raw = await call_claude(
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": [{"type": "text", "text": prompt}]}],
        model="claude-sonnet-4-6",
        max_tokens=700,
    )

    match = re.search(r"\{[\s\S]*\}", raw)
    if not match:
        raise ValueError("Pricing agent: no JSON")
    result: dict[str, Any] = json.loads(match.group())

    missing = {"parts", "labor", "paint", "total"} - result.keys()
    if missing:
        raise ValueError(f"Pricing agent: missing {missing}")
    return result
