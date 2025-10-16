from datetime import datetime
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
import sqlite3

# Ensure project root is on sys.path for imports like backend.database.*
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Mongo helpers
from backend.database.mongo_manager import get_users_collection


def _fetch_single(conn: sqlite3.Connection, query: str, params: tuple) -> Optional[Dict[str, Any]]:
    cur = conn.cursor()
    cur.execute(query, params)
    row = cur.fetchone()
    if row is None:
        return None
    columns = [desc[0] for desc in cur.description]
    return {columns[i]: row[i] for i in range(len(columns))}
    return results[0] if results else None


def _fetch_many(conn: sqlite3.Connection, query: str, params: tuple) -> List[Dict[str, Any]]:
    cur = conn.cursor()
    cur.execute(query, params)
    rows = cur.fetchall()
    columns = [desc[0] for desc in cur.description]
    return [{columns[i]: r[i] for i in range(len(columns))} for r in rows]


def _get_or_create_user_doc(email: str, name_parts: Dict[str, str]) -> Dict[str, Any]:
    users = get_users_collection()
    existing = users.find_one({"email": email})
    if existing:
        return existing
    user_doc = {
        "email": email,
        "name": (name_parts.get("first_name") or "").strip() or name_parts.get("last_name") or email,
        "created_at": datetime.utcnow(),
        # Initialize empty sections that we will fill below
        "assets": [],
        "liabilities": [],
        "income_sources": [],
        "expenses": [],
        "financial_goals": [],
        "risk_profile": None,
        "bank_accounts": [],
        "portfolio_allocation": None,
    }
    users.insert_one(user_doc)
    return users.find_one({"email": email})


def migrate_demo_data_to_user(target_email: str) -> Dict[str, Any]:
    load_dotenv()

    # Initialize SQLite DB access
    default_sqlite = str(PROJECT_ROOT / "backend" / "database" / "wealthwise.db")
    sqlite_path = os.getenv("SQLITE_DB_PATH", default_sqlite)
    if not os.path.exists(sqlite_path):
        # Fallback to project-level database path
        alt_sqlite = str(PROJECT_ROOT / "database" / "wealthwise.db")
        if os.path.exists(alt_sqlite):
            sqlite_path = alt_sqlite
    conn = sqlite3.connect(sqlite_path)

    # Resolve a source demo user to copy from; prefer 'moderate' scenario if available
    source_user = _fetch_single(
        conn,
        """
        SELECT u.* , df.demo_scenario
        FROM users u
        JOIN demo_flags df ON df.user_id = u.id
        WHERE df.is_demo_user = 1
        ORDER BY CASE df.demo_scenario WHEN 'moderate' THEN 0 WHEN 'conservative' THEN 1 ELSE 2 END, u.id ASC
        LIMIT 1
        """,
        tuple(),
    )

    if not source_user:
        raise RuntimeError("No demo user found in SQLite to migrate from.")

    source_user_id = source_user["id"]

    # Collect data from all related tables
    risk = _fetch_single(
        conn,
        "SELECT * FROM risk_profiles WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
        (source_user_id,),
    )
    bank_accounts = _fetch_many(
        conn,
        "SELECT * FROM bank_accounts WHERE user_id = ? ORDER BY current_balance DESC",
        (source_user_id,),
    )
    assets = _fetch_many(
        conn,
        "SELECT * FROM assets WHERE user_id = ? ORDER BY last_updated DESC",
        (source_user_id,),
    )
    liabilities = _fetch_many(
        conn,
        "SELECT * FROM liabilities WHERE user_id = ? ORDER BY last_updated DESC",
        (source_user_id,),
    )
    income_sources = _fetch_many(
        conn,
        "SELECT * FROM income_sources WHERE user_id = ? AND is_active = 1",
        (source_user_id,),
    )
    expenses = _fetch_many(
        conn,
        "SELECT * FROM expenses WHERE user_id = ? AND is_active = 1",
        (source_user_id,),
    )
    goals = _fetch_many(
        conn,
        "SELECT * FROM financial_goals WHERE user_id = ? ORDER BY target_date ASC",
        (source_user_id,),
    )
    portfolio = _fetch_single(
        conn,
        "SELECT * FROM portfolio_allocations WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
        (source_user_id,),
    )

    # Build user doc to upsert
    users = get_users_collection()
    name_parts = {"first_name": source_user.get("first_name"), "last_name": source_user.get("last_name")}
    user_doc = _get_or_create_user_doc(target_email, name_parts)

    update_doc: Dict[str, Any] = {
        "name": f"{(source_user.get('first_name') or '').strip()} {(source_user.get('last_name') or '').strip()}".strip() or user_doc.get("name") or target_email,
        "bank_accounts": [
            {
                "bank_name": b.get("bank_name"),
                "account_type": b.get("account_type"),
                "current_balance": float(b.get("current_balance")) if b.get("current_balance") is not None else None,
                "date_updated": b.get("last_updated"),
            }
            for b in bank_accounts
        ],
        "assets": [
            {
                "name": a.get("name"),
                "type": a.get("type"),
                "category": a.get("category"),
                "current_value": float(a.get("current_value")) if a.get("current_value") is not None else None,
                "quantity": float(a.get("quantity")) if a.get("quantity") is not None else None,
                "date_updated": a.get("last_updated"),
            }
            for a in assets
        ],
        "liabilities": [
            {
                "name": l.get("name"),
                "type": l.get("type"),
                "current_balance": float(l.get("current_balance")) if l.get("current_balance") is not None else None,
                "interest_rate": float(l.get("interest_rate")) if l.get("interest_rate") is not None else None,
                "monthly_payment": float(l.get("monthly_payment")) if l.get("monthly_payment") is not None else None,
                "start_date": l.get("start_date"),
                "maturity_date": l.get("maturity_date"),
                "date_updated": l.get("last_updated"),
            }
            for l in liabilities
        ],
        "income_sources": [
            {
                "source_name": i.get("source_name"),
                "amount": float(i.get("amount")) if i.get("amount") is not None else None,
                "frequency": i.get("frequency"),
                "income_type": i.get("income_type"),
            }
            for i in income_sources
        ],
        "expenses": [
            {
                "category": e.get("category"),
                "amount": float(e.get("amount")) if e.get("amount") is not None else None,
                "frequency": e.get("frequency"),
                "expense_type": e.get("expense_type"),
            }
            for e in expenses
        ],
        "financial_goals": [
            {
                "title": g.get("title"),
                "description": g.get("description"),
                "target_amount": float(g.get("target_amount")) if g.get("target_amount") is not None else None,
                "current_amount": float(g.get("current_amount")) if g.get("current_amount") is not None else None,
                "target_date": g.get("target_date"),
                "goal_type": g.get("goal_type"),
                "priority": g.get("priority"),
                "is_completed": bool(g.get("is_completed")) if g.get("is_completed") is not None else False,
            }
            for g in goals
        ],
        "risk_profile": (
            {
                "risk_score": int(risk.get("risk_score")) if risk and risk.get("risk_score") is not None else None,
                "time_horizon": risk.get("time_horizon") if risk else None,
                "risk_capacity": risk.get("risk_capacity") if risk else None,
                "investment_experience": risk.get("investment_experience") if risk else None,
                "financial_goals": risk.get("financial_goals") if risk else None,
            }
            if risk
            else None
        ),
        "portfolio_allocation": (
            {
                "allocation_name": portfolio.get("allocation_name"),
                "risk_profile": portfolio.get("risk_profile"),
                "equity_percentage": float(portfolio.get("equity_percentage")) if portfolio.get("equity_percentage") is not None else None,
                "debt_percentage": float(portfolio.get("debt_percentage")) if portfolio.get("debt_percentage") is not None else None,
                "gold_percentage": float(portfolio.get("gold_percentage")) if portfolio.get("gold_percentage") is not None else None,
                "international_percentage": float(portfolio.get("international_percentage")) if portfolio.get("international_percentage") is not None else None,
                "cash_percentage": float(portfolio.get("cash_percentage")) if portfolio.get("cash_percentage") is not None else None,
            }
            if portfolio
            else None
        ),
        "migrated_from_sqlite": True,
        "migrated_at": datetime.utcnow(),
    }

    users.update_one({"email": target_email}, {"$set": update_doc}, upsert=True)

    # Close SQLite connection
    try:
        conn.close()
    except Exception:
        pass

    return {
        "source_demo_user_email": source_user.get("email"),
        "target_user_email": target_email,
        "assets_migrated": len(update_doc["assets"]),
        "liabilities_migrated": len(update_doc["liabilities"]),
        "income_sources_migrated": len(update_doc["income_sources"]),
        "expenses_migrated": len(update_doc["expenses"]),
        "goals_migrated": len(update_doc["financial_goals"]),
        "bank_accounts_migrated": len(update_doc["bank_accounts"]),
        "risk_profile": bool(update_doc["risk_profile"]),
        "portfolio_allocation": bool(update_doc["portfolio_allocation"]),
    }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Migrate demo SQLite data to a Mongo user doc")
    parser.add_argument("--email", required=True, help="Target user email in MongoDB")
    args = parser.parse_args()

    result = migrate_demo_data_to_user(args.email)
    print("✅ Migration complete:")
    for k, v in result.items():
        print(f"  - {k}: {v}")


