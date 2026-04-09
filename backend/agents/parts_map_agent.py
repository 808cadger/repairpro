"""agents/parts_map_agent.py — maps damage to repair line items"""
# Aloha from Pearl City! 🌺

import json
import re
from typing import Any

from backend.utils.claude_client import call_claude

SYSTEM_PROMPT = (
    "You are an automotive parts specialist at a certified collision center. "
    "Map damage to repair line items: part name, action (replace/repair/refinish/blend), "
    "source (OEM/aftermarket), quantity. Return ONLY valid JSON array."
)


async def run(vision_result: dict[str, Any], vehicle: dict[str, Any]) -> list[dict[str, Any]]:
    v_desc = f"{vehicle.get('year', '')} {vehicle.get('make', '')} {vehicle.get('model', '')}"
    secondary = ", ".join(vision_result.get("secondary_damage") or []) or "none"

    prompt = (
        f"Map collision damage to repair line items for a {v_desc}.\n\n"
        f"- Primary: {vision_result.get('primary_part')}\n"
        f"- Type: {vision_result.get('damage_type')}\n"
        f"- Severity: {vision_result.get('severity')}\n"
        f"- Secondary: {secondary}\n\n"
        'Return ONLY JSON array: [{"part_name":"<name>","repair_action":"<action>",'
        '"parts_source":"<OEM|aftermarket|n/a>","quantity":<n>,"notes":"<optional>"}]'
    )

    raw = await call_claude(
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": [{"type": "text", "text": prompt}]}],
        model="claude-sonnet-4-6",
        max_tokens=600,
    )

    match = re.search(r"\[[\s\S]*\]", raw)
    if not match:
        raise ValueError("Parts map agent: no JSON array")
    result: list[dict[str, Any]] = json.loads(match.group())
    if not result:
        raise ValueError("Parts map agent: empty array")
    return result
