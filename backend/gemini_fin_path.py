"""
Gemini AI Integration for Financial Path Generation
"""

import json
import os
from typing import Dict, Any

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

def get_gemini_response(user_input: str, risk_profile: str = "conservative") -> Dict[str, Any]:
    """Generate financial path recommendations using Gemini AI when possible.

    If Gemini is unavailable or fails, fall back to a deterministic demo allocation that
    varies by risk profile and parsed amount from user input.
    """
    # Normalize inputs
    text = (user_input or "").strip()
    risk = (risk_profile or "moderate").strip().lower()
    if risk not in {"conservative", "moderate", "aggressive"}:
        risk = "moderate"

    # Parse approximate investable amount from the text; default to 100000 (₹1,00,000)
    amount = _parse_invest_amount(text) or 100000

    # Try Gemini if available and configured
    api_key = os.getenv("GEMINI_API_KEY")
    if GEMINI_AVAILABLE and api_key:
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            system_prompt = (
                "You are a financial planning assistant. Given a user's free-form request and risk profile, "
                "produce a simple JSON with nodes and edges for a flowchart of investment allocation. "
                "Use INR currency symbol ₹ and allocate the parsed total amount. Percentages should sum to 100%. "
                "Allowed buckets: Equity Funds, Debt Funds, Gold, Small Cap, Mid Cap, Liquid Funds, Index Funds. "
                "Respond ONLY with JSON matching this schema: {\n"
                "  \"nodes\": [ { id, position: {x,y}, data: {label}, style: {background, border} } ],\n"
                "  \"edges\": [ { id, source, target, label, style: { stroke } } ]\n"
                "}."
            )

            prompt = (
                f"User text: {text or 'N/A'}\n"
                f"Risk profile: {risk}\n"
                f"Total amount (INR): {amount}\n"
                "Return nodes with a start node labeled 'Investment\\n₹{amount:,}' and 2-4 allocation nodes."
            )

            response = model.generate_content([system_prompt, prompt])
            raw = response.text or "{}"
            # Extract JSON if surrounded by markdown fencing
            json_str = raw
            if "```" in raw:
                json_str = raw.split("```", 2)[1]
                # Remove potential language hint like ```json
                json_str = json_str.split('\n', 1)[-1] if json_str.lower().startswith("json\n") else json_str
            parsed = json.loads(json_str)
            # Minimal validation
            if isinstance(parsed, dict) and parsed.get("nodes") and parsed.get("edges"):
                return parsed
        except Exception:
            # Fall back if Gemini fails for any reason
            pass

    # Deterministic fallback
    return _deterministic_path(amount, risk)

def get_demo_data(risk_profile: str) -> Dict[str, Any]:
    """Legacy demo data by risk profile (kept for compatibility)."""
    
    demo_data = {
        "conservative": {
            "nodes": [
                {
                    "id": "start",
                    "position": {"x": 250, "y": 50},
                    "data": {"label": "Investment\n₹1,00,000"},
                    "style": {"background": "bg-blue-100", "border": "border-blue-500"}
                },
                {
                    "id": "debt",
                    "position": {"x": 100, "y": 200},
                    "data": {"label": "Debt Funds\n₹60,000"},
                    "style": {"background": "bg-blue-100", "border": "border-blue-500"}
                },
                {
                    "id": "equity",
                    "position": {"x": 300, "y": 200},
                    "data": {"label": "Equity Funds\n₹25,000"},
                    "style": {"background": "bg-green-100", "border": "border-green-500"}
                },
                {
                    "id": "gold",
                    "position": {"x": 500, "y": 200},
                    "data": {"label": "Gold\n₹15,000"},
                    "style": {"background": "bg-yellow-100", "border": "border-yellow-500"}
                }
            ],
            "edges": [
                {"id": "e-debt", "source": "start", "target": "debt", "label": "60%", "style": {"stroke": "stroke-blue-500"}},
                {"id": "e-equity", "source": "start", "target": "equity", "label": "25%", "style": {"stroke": "stroke-green-500"}},
                {"id": "e-gold", "source": "start", "target": "gold", "label": "15%", "style": {"stroke": "stroke-yellow-500"}}
            ]
        },
        "moderate": {
            "nodes": [
                {
                    "id": "start",
                    "position": {"x": 250, "y": 50},
                    "data": {"label": "Investment\n₹1,00,000"},
                    "style": {"background": "bg-blue-100", "border": "border-blue-500"}
                },
                {
                    "id": "equity",
                    "position": {"x": 100, "y": 200},
                    "data": {"label": "Equity Funds\n₹50,000"},
                    "style": {"background": "bg-green-100", "border": "border-green-500"}
                },
                {
                    "id": "debt",
                    "position": {"x": 300, "y": 200},
                    "data": {"label": "Debt Funds\n₹30,000"},
                    "style": {"background": "bg-blue-100", "border": "border-blue-500"}
                },
                {
                    "id": "gold",
                    "position": {"x": 500, "y": 200},
                    "data": {"label": "Gold\n₹20,000"},
                    "style": {"background": "bg-yellow-100", "border": "border-yellow-500"}
                }
            ],
            "edges": [
                {"id": "e-equity", "source": "start", "target": "equity", "label": "50%", "style": {"stroke": "stroke-green-500"}},
                {"id": "e-debt", "source": "start", "target": "debt", "label": "30%", "style": {"stroke": "stroke-blue-500"}},
                {"id": "e-gold", "source": "start", "target": "gold", "label": "20%", "style": {"stroke": "stroke-yellow-500"}}
            ]
        },
        "aggressive": {
            "nodes": [
                {
                    "id": "start",
                    "position": {"x": 250, "y": 50},
                    "data": {"label": "Investment\n₹1,00,000"},
                    "style": {"background": "bg-blue-100", "border": "border-blue-500"}
                },
                {
                    "id": "equity",
                    "position": {"x": 80, "y": 200},
                    "data": {"label": "Equity Funds\n₹70,000"},
                    "style": {"background": "bg-green-100", "border": "border-green-500"}
                },
                {
                    "id": "smallcap",
                    "position": {"x": 250, "y": 200},
                    "data": {"label": "Small Cap\n₹20,000"},
                    "style": {"background": "bg-red-100", "border": "border-red-500"}
                },
                {
                    "id": "debt",
                    "position": {"x": 420, "y": 200},
                    "data": {"label": "Debt Funds\n₹10,000"},
                    "style": {"background": "bg-blue-100", "border": "border-blue-500"}
                }
            ],
            "edges": [
                {"id": "e-equity", "source": "start", "target": "equity", "label": "70%", "style": {"stroke": "stroke-green-500"}},
                {"id": "e-smallcap", "source": "start", "target": "smallcap", "label": "20%", "style": {"stroke": "stroke-red-500"}},
                {"id": "e-debt", "source": "start", "target": "debt", "label": "10%", "style": {"stroke": "stroke-blue-500"}}
            ]
        }
    }
    
    return demo_data.get(risk_profile, demo_data["moderate"])


# ------------------------ Helpers ------------------------

def _parse_invest_amount(text: str) -> int:
    """Parse an approximate amount from free-form text in INR.

    Supports formats like '10 lakhs', '1 lakh', '2.5 cr', '250000', '₹1,50,000'.
    Returns an integer number of rupees if detected, else None.
    """
    if not text:
        return None
    t = text.lower().replace(",", " ").replace("₹", " ")
    # Handle lakh / crore keywords
    import re
    lakh_match = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*lakh", t)
    if lakh_match:
        return int(float(lakh_match.group(1)) * 100000)
    cr_match = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*(?:cr|crore)", t)
    if cr_match:
        return int(float(cr_match.group(1)) * 10000000)
    # Plain number
    num_match = re.search(r"([0-9]{2,})(?:\s*rs|\s*inr)?", t)
    if num_match:
        try:
            return int(float(num_match.group(1)))
        except Exception:
            return None
    return None


def _deterministic_path(amount: int, risk: str) -> Dict[str, Any]:
    """Create a simple allocation varying by risk and total amount."""
    if risk == "conservative":
        allocation = [("Debt Funds", 0.6), ("Equity Funds", 0.25), ("Gold", 0.15)]
        colors = {"Debt Funds": ("bg-blue-100", "border-blue-500"),
                  "Equity Funds": ("bg-green-100", "border-green-500"),
                  "Gold": ("bg-yellow-100", "border-yellow-500")}
    elif risk == "aggressive":
        allocation = [("Equity Funds", 0.7), ("Small Cap", 0.2), ("Debt Funds", 0.1)]
        colors = {"Equity Funds": ("bg-green-100", "border-green-500"),
                  "Small Cap": ("bg-red-100", "border-red-500"),
                  "Debt Funds": ("bg-blue-100", "border-blue-500")}
    else:  # moderate
        allocation = [("Equity Funds", 0.5), ("Debt Funds", 0.3), ("Gold", 0.2)]
        colors = {"Equity Funds": ("bg-green-100", "border-green-500"),
                  "Debt Funds": ("bg-blue-100", "border-blue-500"),
                  "Gold": ("bg-yellow-100", "border-yellow-500")}

    nodes = [
        {
            "id": "start",
            "position": {"x": 250, "y": 50},
            "data": {"label": f"Investment\n₹{amount:,}"},
            "style": {"background": "bg-blue-100", "border": "border-blue-500"},
        }
    ]
    edges = []

    x_positions = [100, 300, 500, 700]
    for idx, (bucket, pct) in enumerate(allocation):
        alloc_amount = int(round(amount * pct))
        node_id = bucket.lower().replace(" ", "")
        bg, border = colors[bucket]
        nodes.append({
            "id": node_id,
            "position": {"x": x_positions[idx], "y": 200},
            "data": {"label": f"{bucket}\n₹{alloc_amount:,}"},
            "style": {"background": bg, "border": border},
        })
        edges.append({
            "id": f"e-{node_id}",
            "source": "start",
            "target": node_id,
            "label": f"{int(pct*100)}%",
            "style": {"stroke": border.replace("border-", "stroke-")},
        })

    return {"nodes": nodes, "edges": edges}
