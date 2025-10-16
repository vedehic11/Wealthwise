from datetime import datetime
import os
from typing import List, Dict

from dotenv import load_dotenv
from pymongo import MongoClient


def normalize_asset_category(asset: Dict) -> str:
    t = (asset.get("type") or "").lower()
    n = (asset.get("name") or "").lower()
    if "mutual" in t or "fund" in n:
        return "investments"
    if "stock" in t or "equity" in t:
        return "investments"
    if "ppf" in t or "fd" in t or "ppf" in n or "fixed" in t:
        return "bank"
    if "gold" in t or "gold" in n:
        return "other"
    if "real" in t or "apartment" in n or "property" in n:
        return "realestate"
    return asset.get("category") or "investments"


def build_demo_liabilities() -> List[Dict]:
    return [
        {
            "name": "Home Loan",
            "type": "mortgage",
            "current_balance": 1800000,
            "interest_rate": 8.5,
            "monthly_payment": 22000,
            "start_date": "2015-01-01",
            "maturity_date": "2040-12-31",
            "last_updated": datetime.utcnow().isoformat(),
        },
        {
            "name": "Car Loan",
            "type": "auto",
            "current_balance": 600000,
            "interest_rate": 9.2,
            "monthly_payment": 12000,
            "start_date": "2023-01-01",
            "maturity_date": "2028-06-15",
            "last_updated": datetime.utcnow().isoformat(),
        },
        {
            "name": "Credit Card Outstanding",
            "type": "credit",
            "current_balance": 45000,
            "interest_rate": 42.0,
            "monthly_payment": 15000,
            "start_date": "2025-01-01",
            "maturity_date": None,
            "last_updated": datetime.utcnow().isoformat(),
        },
    ]


def enrich_user(email: str) -> Dict:
    load_dotenv()
    uri = os.getenv("MONGODB_URI")
    client = MongoClient(uri)
    db = client["wealthwise"]
    users = db["users"]

    user = users.find_one({"email": email})
    if not user:
        raise RuntimeError(f"User {email} not found")

    # Normalize asset categories and add a sample real estate if none exists
    assets = user.get("assets", [])
    normalized_assets = []
    for a in assets:
        a = dict(a)
        a["category"] = normalize_asset_category(a)
        normalized_assets.append(a)

    if not any(a.get("category") == "realestate" for a in normalized_assets):
        normalized_assets.append({
            "name": "Apartment Investment",
            "type": "Real Estate",
            "category": "realestate",
            "current_value": 2500000,
            "quantity": 1,
            "date_updated": datetime.utcnow().isoformat(),
        })

    # Only set demo liabilities if absent
    liabilities = user.get("liabilities", [])
    if not liabilities:
        liabilities = build_demo_liabilities()

    # Add extra income sources to make graphs richer if only one exists
    incomes = user.get("income_sources") or user.get("income") or []
    if len(incomes) <= 1:
        extra_incomes = [
            {"source_name": "Apartment Rental", "amount": 25000, "frequency": "monthly", "income_type": "other"},
            {"source_name": "Mutual Fund Dividends", "amount": 8500, "frequency": "monthly", "income_type": "investment"},
        ]
        incomes = incomes + extra_incomes

    users.update_one(
        {"email": email},
        {"$set": {
            "assets": normalized_assets,
            "liabilities": liabilities,
            "income_sources": incomes,
            "migrated_at": datetime.utcnow(),
        }}
    )

    updated = users.find_one({"email": email}, {"_id": 0})
    return {
        "assets_count": len(updated.get("assets", [])),
        "liabilities_count": len(updated.get("liabilities", [])),
        "email": updated.get("email"),
    }


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Enrich a Mongo user with normalized assets and demo liabilities if missing")
    parser.add_argument("--email", required=True, help="User email to enrich")
    args = parser.parse_args()
    res = enrich_user(args.email)
    print("✅ Enriched user:")
    for k, v in res.items():
        print(f"  - {k}: {v}")


