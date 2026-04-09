"""agents/vision_agent.py — Claude vision for damage assessment"""
# Aloha from Pearl City! 🌺

import json
import re
from typing import Any

from backend.utils.claude_client import call_claude

SYSTEM_PROMPT = (
    "You are an expert automotive damage assessor with 20 years of collision repair experience. "
    "Analyze vehicle damage photos with clinical precision. Identify: (1) the exact damaged panel "
    "using standard collision repair terminology, (2) damage type: dent/crease/scratch/crack/tear/shatter/missing, "
    "(3) severity: minor/moderate/severe, (4) secondary damage on adjacent parts, "
    "(5) prior repair indicators. Use cautious language. Return ONLY valid JSON."
)


async def run(vehicle: dict[str, Any], image_payloads: list[dict[str, Any]]) -> dict[str, Any]:
    """Run vision agent against 1-2 uploaded images."""
    v_desc = f"{vehicle.get('year', '')} {vehicle.get('make', '')} {vehicle.get('model', '')}"
    trim = vehicle.get("trim", "")
    if trim:
        v_desc += f" {trim}"

    text_block = {
        "type": "text",
        "text": (
            f"Analyze the damage in {'these photos' if len(image_payloads) > 1 else 'this photo'} "
            f"of a {v_desc}.\n\n"
            "Return ONLY this JSON:\n"
            '{"primary_part":"<panel name>","damage_type":"<type>","severity":"<minor|moderate|severe>",'
            '"secondary_damage":["<part — type>"],"prior_repair_indicators":<bool>,'
            '"photo_quality":"<good|fair|poor>","raw_description":"<2-3 sentences>"}\n\n'
            "Use Mitchell/Audatex naming. Return ONLY JSON."
        ),
    }

    raw = await call_claude(
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": image_payloads + [text_block]}],
        model="claude-sonnet-4-6",
        max_tokens=800,
    )

    match = re.search(r"\{[\s\S]*\}", raw)
    if not match:
        raise ValueError("Vision agent: no JSON in response")
    result: dict[str, Any] = json.loads(match.group())

    missing = {"primary_part", "damage_type", "severity"} - result.keys()
    if missing:
        raise ValueError(f"Vision agent: missing {missing}")
    return result
