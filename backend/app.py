from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import json

sys.path.append(os.path.dirname(__file__))

# Import database manager
from database.mongo_manager import (
    insert_user, find_user_by_email, get_users_collection,
    get_all_stocks, get_stock_by_symbol,
    get_stock_analysis, get_all_analysis_types, get_all_popular_stocks
)

try:
    from gemini_fin_path import get_gemini_response
    GEMINI_AVAILABLE = True
    print("✅ Gemini AI loaded successfully")
except Exception as e:
    print(f"⚠️ Gemini not available - using demo data only: {str(e)[:100]}")
    GEMINI_AVAILABLE = False
    # Create fallback function
    def get_gemini_response(prompt, demo_scenario="young_professional"):
        return f"Demo response for {demo_scenario}: This is a placeholder financial path response."

app = Flask(__name__)
CORS(app)

# --- Custom Authentication Endpoints ---
from werkzeug.security import generate_password_hash, check_password_hash

# No need for duplicate agent endpoint - the main one is below

@app.route('/')
def hello():
    return """
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
        <h1 style="color: #2563eb;">🚀 WealthWise Backend API</h1>
        <p style="font-size: 18px; color: #374151;">Your AI-powered financial assistant backend is running successfully!</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1f2937;">📊 Available Endpoints:</h2>
            <ul style="line-height: 1.8;">
                <li><strong>/health</strong> - API health check</li>
                <li><strong>/ai-financial-path</strong> - Get AI-powered investment recommendations</li>
                <li><strong>/agent</strong> - Chat with financial AI assistant</li>
                <li><strong>/auto-bank-data</strong> - Get demo bank account data</li>
                <li><strong>/auto-mf-data</strong> - Get demo mutual fund data</li>
                <li><strong>/stocks</strong> - Get all stock data</li>
                <li><strong>/user-portfolio/{user_id}</strong> - Get user portfolio data</li>
            </ul>
        </div>
        
        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <p style="color: #065f46; margin: 0;"><strong>✅ Status:</strong> Database-powered with comprehensive demo data!</p>
        </div>
    </div>
    """

@app.route('/user/liabilities', methods=['PUT', 'OPTIONS'])
def update_user_liabilities():
    try:
        if request.method == 'OPTIONS':
            return ("", 200)
        data = request.get_json() or {}
        user_email = (data.get('email') or '').strip().lower()
        liabilities = data.get('liabilities') or []
        if not user_email:
            return jsonify({"error": "Missing email"}), 400

        normalized = []
        for liab in liabilities:
            normalized.append({
                "name": liab.get('name'),
                "type": (liab.get('type') or liab.get('category') or 'other').lower(),
                "current_balance": liab.get('current_balance') or liab.get('amount') or 0,
                "interest_rate": liab.get('interest_rate') or liab.get('interestRate') or 0,
                "monthly_payment": liab.get('monthly_payment') or liab.get('monthlyPayment') or 0,
                "start_date": liab.get('start_date') or liab.get('startDate') or None,
                "maturity_date": liab.get('maturity_date') or liab.get('endDate') or None,
            })

        from database.mongo_manager import get_users_collection
        users = get_users_collection()
        res = users.update_one({"email": user_email}, {"$set": {"liabilities": normalized}})
        if res.matched_count == 0:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/user/assets', methods=['PUT', 'OPTIONS'])
def update_user_assets():
    try:
        if request.method == 'OPTIONS':
            return ("", 200)
        data = request.get_json() or {}
        user_email = (data.get('email') or '').strip().lower()
        assets = data.get('assets') or []
        if not user_email:
            return jsonify({"error": "Missing email"}), 400
        normalized = []
        for a in assets:
            normalized.append({
                "name": a.get('name'),
                "type": a.get('type'),
                "category": a.get('category') or 'investments',
                "current_value": a.get('current_value') or a.get('value') or 0,
                "quantity": a.get('quantity') or 0,
                "date_updated": a.get('date_updated') or None,
            })
        from database.mongo_manager import get_users_collection
        users = get_users_collection()
        res = users.update_one({"email": user_email}, {"$set": {"assets": normalized}})
        if res.matched_count == 0:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/user/incomes', methods=['PUT', 'OPTIONS'])
def update_user_incomes():
    try:
        if request.method == 'OPTIONS':
            return ("", 200)
        data = request.get_json() or {}
        user_email = (data.get('email') or '').strip().lower()
        incomes = data.get('incomes') or []
        if not user_email:
            return jsonify({"error": "Missing email"}), 400
        normalized = []
        for i in incomes:
            normalized.append({
                "source_name": i.get('source_name') or i.get('source'),
                "amount": i.get('amount') or 0,
                "frequency": i.get('frequency') or 'monthly',
                "income_type": i.get('income_type') or i.get('category') or 'other',
            })
        from database.mongo_manager import get_users_collection
        users = get_users_collection()
        res = users.update_one({"email": user_email}, {"$set": {"income_sources": normalized}})
        if res.matched_count == 0:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/user/expenses', methods=['PUT', 'OPTIONS'])
def update_user_expenses():
    try:
        if request.method == 'OPTIONS':
            return ("", 200)
        data = request.get_json() or {}
        user_email = (data.get('email') or '').strip().lower()
        expenses = data.get('expenses') or []
        if not user_email:
            return jsonify({"error": "Missing email"}), 400
        normalized = []
        for e in expenses:
            normalized.append({
                "category": e.get('category'),
                "amount": e.get('amount') or 0,
                "frequency": e.get('frequency') or 'monthly',
                "expense_type": e.get('expense_type') or e.get('type') or 'variable',
            })
        from database.mongo_manager import get_users_collection
        users = get_users_collection()
        res = users.update_one({"email": user_email}, {"$set": {"expenses": normalized}})
        if res.matched_count == 0:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/user/goals', methods=['PUT', 'OPTIONS'])
def update_user_goals():
    try:
        if request.method == 'OPTIONS':
            return ("", 200)
        data = request.get_json() or {}
        user_email = (data.get('email') or '').strip().lower()
        goals = data.get('goals') or []
        if not user_email:
            return jsonify({"error": "Missing email"}), 400
        normalized = []
        for g in goals:
            normalized.append({
                "title": g.get('title') or g.get('name'),
                "description": g.get('description'),
                "target_amount": g.get('target_amount') or g.get('target') or 0,
                "current_amount": g.get('current_amount') or g.get('current') or 0,
                "target_date": g.get('target_date') or g.get('deadline') or None,
                "goal_type": g.get('goal_type') or 'other',
                "priority": g.get('priority') or 'medium',
                "is_completed": g.get('is_completed') or False,
            })
        from database.mongo_manager import get_users_collection
        users = get_users_collection()
        res = users.update_one({"email": user_email}, {"$set": {"financial_goals": normalized}})
        if res.matched_count == 0:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/user/risk', methods=['PUT', 'OPTIONS'])
def update_user_risk():
    try:
        if request.method == 'OPTIONS':
            return ("", 200)
        data = request.get_json() or {}
        user_email = (data.get('email') or '').strip().lower()
        risk = data.get('risk') or {}
        if not user_email:
            return jsonify({"error": "Missing email"}), 400
        normalized = {
            "risk_score": risk.get('score') or risk.get('risk_score') or 0,
            "time_horizon": risk.get('timeHorizon') or risk.get('time_horizon') or 'medium',
            "risk_capacity": risk.get('riskCapacity') or risk.get('risk_capacity') or 'moderate',
            "investment_experience": risk.get('investment_experience') or 'intermediate',
            "financial_goals": risk.get('financial_goals') or None,
        }
        from database.mongo_manager import get_users_collection
        users = get_users_collection()
        res = users.update_one({"email": user_email}, {"$set": {"risk_profile": normalized}})
        if res.matched_count == 0:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/register', methods=['POST', 'OPTIONS'])
def register():
    try:
        if request.method == 'OPTIONS':
            return ("", 200)
        payload = request.get_json() or {}
        email = (payload.get('email') or '').strip().lower()
        password = payload.get('password') or ''
        first_name = payload.get('first_name') or ''
        last_name = payload.get('last_name') or ''
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        users = get_users_collection()
        # Prevent duplicate registration
        if users.find_one({"email": email}):
            return jsonify({"error": "User already exists. Please sign in."}), 409
        password_hash = generate_password_hash(password)
        user_doc = {
            "email": email,
            "name": f"{first_name} {last_name}".strip() or email,
            "password_hash": password_hash,
            "is_demo_user": (email == 'vedehi@gmail.com'),
        }
        users.update_one({"email": email}, {"$set": user_doc}, upsert=True)
        saved = users.find_one({"email": email}, {"_id": 0, "password_hash": 0})
        return jsonify({"user": saved}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/login', methods=['POST', 'OPTIONS'])
def login():
    try:
        if request.method == 'OPTIONS':
            return ("", 200)
        payload = request.get_json() or {}
        email = (payload.get('email') or '').strip().lower()
        password = payload.get('password') or ''
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        users = get_users_collection()
        user = users.find_one({"email": email})
        if not user:
            return jsonify({"error": "User not found. Please sign up."}), 404
        stored = user.get('password_hash')
        if stored and not check_password_hash(stored, password):
            return jsonify({"error": "Invalid credentials"}), 401

        safe_user = {k: v for k, v in user.items() if k not in ("_id", "password_hash")}
        return jsonify({"user": safe_user}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health')
def health():
    try:
        # Test MongoDB connection
        from database.mongo_manager import get_users_collection, get_stocks_collection
        user_count = get_users_collection().count_documents({})
        stock_count = get_stocks_collection().count_documents({})
        return jsonify({
            "status": "healthy", 
            "database": "connected",
            "demo_users": user_count,
            "stocks_available": stock_count
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/ai-financial-path', methods=['POST'])
def ai_financial_path():
    """Generate a financial path using Gemini when available; otherwise a smart demo fallback.

    Expected input (form-data or JSON):
      - input: free-form user text describing goals/amount/time horizon
      - risk: one of conservative | moderate | aggressive
    """
    try:
        # Support both form-data and JSON
        data = request.get_json(silent=True) or {}
        if not data:
            # Fallback to form data
            data = {
                "input": request.form.get('input', ''),
                "risk": request.form.get('risk', ''),
            }

        user_input = (data.get('input') or data.get('user_input') or '').strip()
        risk = (data.get('risk') or '').strip().lower()
        if risk not in {"conservative", "moderate", "aggressive"}:
            risk = "moderate"

        # Use Gemini-backed generator if available; the imported function internally
        # reads the API key from environment and falls back to demo if needed.
        result = get_gemini_response(user_input, risk)
        return jsonify(result)
    except Exception as e:
        print(f"Error in ai-financial-path: {str(e)}")
        return jsonify({"error": "Unable to generate financial path"}), 500

@app.route('/agent', methods=['POST'])
def agent():
    try:
        data = request.get_json()
        user_input = data.get('user_input', '').lower()
        
        # Hardcoded demo mode: do not link to any user or save conversations
        
        # Check for demo queries first
        normalized = (user_input or '').strip().lower()
        print(f"[AGENT] Processing input: '{normalized}'")

        # Demo 1: Adani Green price
        if 'what is the stock price of adani green' in normalized or ('adani green' in normalized and 'stock price' in normalized):
            print("[AGENT] Matched: Adani Green demo")
            response = """<div style="font-family: system-ui, sans-serif; background: white; color: #111; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; max-width: 480px;">
<h3 style="margin: 0 0 12px 0; color: #111; font-size: 16px; font-weight: 600;">🌱 Adani Green Energy <span style="color: #6b7280; font-size: 14px;">ADANIGREEN.NS</span></h3>

<div style="background: #f8fafc; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
<div style="font-size: 24px; font-weight: 700; color: #111; margin-bottom: 2px;">₹1,156.30 <span style="color: #059669; font-size: 14px; font-weight: 600;">+2.3%</span></div>
<div style="color: #6b7280; font-size: 12px;">Oct 08, 2025</div>
</div>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
<div style="background: #f8fafc; padding: 8px; border-radius: 4px;">
<div style="color: #6b7280; font-size: 11px; margin-bottom: 2px;">RANGE</div>
<div style="color: #111; font-weight: 600; font-size: 14px;">₹1,145 - ₹1,168</div>
</div>
<div style="background: #f8fafc; padding: 8px; border-radius: 4px;">
<div style="color: #6b7280; font-size: 11px; margin-bottom: 2px;">VOLUME</div>
<div style="color: #111; font-weight: 600; font-size: 14px;">2.1M</div>
</div>
</div>

<div style="text-align: center; padding: 8px; background: #f0fdf4; border-radius: 4px; border: 1px solid #bbf7d0;">
<div style="color: #166534; font-weight: 600; font-size: 14px;">📈 BUY | Target: ₹1,250</div>
</div>
</div>"""
            
            return jsonify({"response": response})

        # Demo 2: TCS Analysis
        elif 'give me analysis for tata consultancy services' in normalized or ('tata consultancy services' in normalized and 'analysis' in normalized) or ('tcs' in normalized and 'analysis' in normalized):
            print("[AGENT] Matched: TCS analysis demo")
            response = """<div style="font-family: system-ui, sans-serif; background: white; color: #111; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; max-width: 480px;">
<h3 style="margin: 0 0 12px 0; color: #111; font-size: 16px; font-weight: 600;">� Tata Consultancy Services <span style="color: #6b7280; font-size: 14px;">TCS.NS</span></h3>

<div style="text-align: center; background: #f0fdf4; padding: 16px; border-radius: 4px; margin-bottom: 12px; border: 1px solid #bbf7d0;">
<div style="font-size: 24px; font-weight: 700; color: #059669; margin-bottom: 4px;">₹3,890.25</div>
<div style="color: #374151; font-weight: 600; font-size: 14px;">Current Price</div>
</div>

<div style="background: #f8fafc; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
<div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
<span style="color: #6b7280; font-size: 14px;">Technical Rating:</span>
<span style="color: #059669; font-weight: 600;">BUY</span>
</div>
<div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
<span style="color: #6b7280; font-size: 14px;">Fundamental Score:</span>
<span style="color: #059669; font-weight: 600;">Strong</span>
</div>
<div style="display: flex; justify-content: space-between;">
<span style="color: #6b7280; font-size: 14px;">Risk Level:</span>
<span style="color: #f59e0b; font-weight: 600;">Moderate</span>
</div>
</div>

<div style="background: #f0fdf4; padding: 12px; border-radius: 4px; border-left: 4px solid #10b981; margin-bottom: 12px;">
<div style="color: #065f46; font-weight: 600; margin-bottom: 4px; font-size: 14px;">📊 Investment Outlook</div>
<div style="color: #065f46; font-size: 13px; line-height: 1.4;">Strong Q2 results, digital transformation growth, good margin expansion prospects.</div>
</div>

<div style="text-align: center; padding: 8px; background: #f0fdf4; border-radius: 4px; border: 1px solid #bbf7d0;">
<div style="color: #059669; font-weight: 600; font-size: 14px;">🎯 Target: ₹4,200</div>
</div>
</div>"""
            return jsonify({"response": response})

        # Demo 3: Reliance Analysis
        elif 'what is the stock analysis for reliance industries' in normalized or ('reliance industries' in normalized and ('analysis' in normalized or 'stock analysis' in normalized)) or ('reliance' in normalized and 'analysis' in normalized):
            print("[AGENT] Matched: Reliance analysis demo")
            response = """<div style="font-family: system-ui, sans-serif; background: white; color: #111; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; max-width: 480px;">
<h3 style="margin: 0 0 12px 0; color: #111; font-size: 16px; font-weight: 600;">🏭 Reliance Industries <span style="color: #6b7280; font-size: 14px;">RELIANCE.NS</span></h3>

<div style="text-align: center; background: #f0f9ff; padding: 16px; border-radius: 4px; margin-bottom: 12px; border: 1px solid #bfdbfe;">
<div style="font-size: 24px; font-weight: 700; color: #1d4ed8; margin-bottom: 4px;">₹2,450.75</div>
<div style="color: #374151; font-weight: 600; font-size: 14px;">Current Price</div>
</div>

<div style="background: #f8fafc; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
<div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
<span style="color: #6b7280; font-size: 14px;">Sector:</span>
<span style="color: #111; font-weight: 600;">Oil & Gas</span>
</div>
<div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
<span style="color: #6b7280; font-size: 14px;">Market Cap:</span>
<span style="color: #111; font-weight: 600;">₹16.6L Cr</span>
</div>
<div style="display: flex; justify-content: space-between;">
<span style="color: #6b7280; font-size: 14px;">PE Ratio:</span>
<span style="color: #111; font-weight: 600;">28.5</span>
</div>
</div>

<div style="background: #fffbeb; padding: 12px; border-radius: 4px; border-left: 4px solid #f59e0b; margin-bottom: 12px;">
<div style="color: #92400e; font-weight: 600; margin-bottom: 4px; font-size: 14px;">⚖️ Analysis Summary</div>
<div style="color: #92400e; font-size: 13px; line-height: 1.4;">Diversified conglomerate with strong fundamentals. Retail & telecom growth offsetting oil volatility.</div>
</div>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
<div style="text-align: center; padding: 8px; background: #f0f9ff; border-radius: 4px; border: 1px solid #bfdbfe;">
<div style="color: #1d4ed8; font-weight: 600; font-size: 14px;">📈 HOLD</div>
</div>
<div style="text-align: center; padding: 8px; background: #fffbeb; border-radius: 4px; border: 1px solid #fed7aa;">
<div style="color: #92400e; font-weight: 600; font-size: 14px;">🎯 ₹2,600</div>
</div>
</div>
</div>"""
            return jsonify({"response": response})

        # Demo 4: Portfolio performance
        elif (
            'how is my portfolio performing' in normalized or
            'how is my portfolio doing' in normalized or
            'portfolio performance' in normalized or
            'portfolio performing' in normalized or
            (('how is' in normalized or 'how\'s' in normalized or 'hows' in normalized) and 'portfolio' in normalized)
        ):
            print("[AGENT] Matched: Portfolio performance demo")
            response = """<div style="font-family: system-ui, sans-serif; background: white; color: #111; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; max-width: 520px;">
<h3 style="margin: 0 0 12px 0; color: #111; font-size: 16px; font-weight: 600;">📈 Portfolio Performance (Last 30 days)</h3>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
  <div style="background:#f8fafc; padding:12px; border-radius:6px;">
    <div style="color:#6b7280; font-size:12px;">Net Worth</div>
    <div style="font-weight:700; font-size:18px;">₹7.77L</div>
  </div>
  <div style="background:#f0fdf4; padding:12px; border-radius:6px; border:1px solid #bbf7d0;">
    <div style="color:#065f46; font-size:12px;">Change</div>
    <div style="font-weight:700; color:#059669; font-size:18px;">+2.8%</div>
  </div>
</div>

<div style="background:#fffbeb; padding:12px; border-left:4px solid #f59e0b; border-radius:6px;">
  <div style="color:#92400e; font-weight:600; font-size:14px;">Summary</div>
  <div style="color:#92400e; font-size:13px; line-height:1.4;">Equities outperformed while expenses remained stable. Maintain SIPs; consider rebalancing 5% from cash to equities.</div>
  </div>
</div>"""
            return jsonify({"response": response})

        # Demo 5: What to invest in next
        elif (
            'what should i invest in next' in normalized or
            'what to invest in next' in normalized or
            ('invest' in normalized and ('next' in normalized or 'now' in normalized)) or
            'where should i invest' in normalized
        ):
            print("[AGENT] Matched: What to invest next demo")
            response = """<div style="font-family: system-ui, sans-serif; background: white; color: #111; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; max-width: 520px;">
<h3 style="margin: 0 0 12px 0; color: #111; font-size: 16px; font-weight: 600;">🧭 What to invest in next</h3>

<ol style="margin:0; padding-left:18px; line-height:1.6;">
  <li><strong>Large-cap equity index fund</strong> — monthly SIP ₹10,000</li>
  <li><strong>Debt fund (short duration)</strong> — allocate 20% for stability</li>
  <li><strong>Gold ETF</strong> — 5–10% as hedge</li>
  <li><strong>Emergency fund</strong> — 6 months expenses in liquid fund</li>
  <li><strong>Rebalance</strong> — keep equity:debt near 70:30</li>
  </ol>

<div style="margin-top:12px; background:#f8fafc; padding:10px; border-radius:6px; font-size:12px; color:#6b7280;">This is demo guidance. Not investment advice.</div>
</div>"""
            return jsonify({"response": response})

        # For non-demo queries, return a helpful message
        else:
            print("[AGENT] No demo match - returning help message")
            response = """<div style="font-family: system-ui, sans-serif; background: white; color: #111; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; max-width: 480px;">
<h3 style="margin: 0 0 12px 0; color: #111; font-size: 16px; font-weight: 600;">💡 Available Demo Queries</h3>

<div style="background: #f8fafc; padding: 12px; border-radius: 4px; margin-bottom: 12px;">
<div style="color: #374151; font-size: 14px; line-height: 1.5;">
Try these stock analysis queries:
</div>
</div>

<div style="background: #f0f9ff; padding: 12px; border-radius: 4px; margin-bottom: 8px; border-left: 4px solid #0ea5e9;">
<div style="color: #0369a1; font-size: 13px;">💹 "What is the stock price of Adani Green?"</div>
</div>

<div style="background: #f0f9ff; padding: 12px; border-radius: 4px; margin-bottom: 8px; border-left: 4px solid #0ea5e9;">
<div style="color: #0369a1; font-size: 13px;">📊 "Give me analysis for Tata Consultancy Services"</div>
</div>

<div style="background: #f0f9ff; padding: 12px; border-radius: 4px; border-left: 4px solid #0ea5e9;">
<div style="color: #0369a1; font-size: 13px;">🏭 "What is the stock analysis for Reliance Industries?"</div>
</div>
</div>"""
            
            return jsonify({"response": response})
        
    except Exception as e:
        print(f"Error in agent endpoint: {str(e)}")
        return jsonify({"response": "Sorry, I encountered an error. Please try again."}), 500@app.route('/auto-bank-data', methods=['GET'])
def auto_bank_data():
    """Get user bank account data from MongoDB using email"""
    from database.mongo_manager import find_user_by_email
    try:
        user_email = request.args.get('email')
        if not user_email:
            return jsonify({"error": "Missing user email"}), 400
        user = find_user_by_email(user_email)
        if not user:
            return jsonify({"error": "User not found"}), 404
        bank_accounts = user.get('bank_accounts', [])
        demo_data = {
            "assets": [
                {
                    "Name": account.get('bank_name', '') + " " + account.get('account_type', '').title(),
                    "Type": "Bank Account",
                    "Value": str(int(account.get('current_balance', 0))),
                    "DateUpdated": account.get('date_updated', "2024-01-01")
                }
                for account in bank_accounts
            ]
        }
        return jsonify(demo_data)
    except Exception as e:
        print(f"Error in auto-bank-data: {str(e)}")
        # Fallback to static data
        return jsonify({
            "assets": [
                {"Name": "SBI Savings Account", "Type": "Cash", "Value": "850000", "DateUpdated": "2024-01-01"},
                {"Name": "HDFC Current Account", "Type": "Cash", "Value": "250000", "DateUpdated": "2024-01-01"}
            ]
        })

@app.route('/auto-mf-data', methods=['GET'])
def auto_mf_data():
    """Get user mutual fund data from MongoDB using email"""
    from database.mongo_manager import find_user_by_email
    try:
        user_email = request.args.get('email')
        if not user_email:
            return jsonify({"error": "Missing user email"}), 400
        user = find_user_by_email(user_email)
        if not user:
            return jsonify({"error": "User not found"}), 404
        assets = user.get('assets', [])
        mf_assets = [asset for asset in assets if asset.get('type') == 'Mutual Fund']
        demo_data = {
            "assets": [
                {
                    "Name": asset.get('name', ''),
                    "Type": "Mutual Fund",
                    "Value": str(int(asset.get('current_value', 0))),
                    "DateUpdated": asset.get('date_updated', "2024-01-01"),
                    "Quantity": str(asset.get('quantity', 0))
                }
                for asset in mf_assets
            ]
        }
        return jsonify(demo_data)
    except Exception as e:
        print(f"Error in auto-mf-data: {str(e)}")
        # Fallback to static data
        return jsonify({
            "assets": [
                {"Name": "Nippon India Large Cap Fund Direct Growth", "Type": "Mutual Fund", "Value": "275000", "DateUpdated": "2024-01-01", "Quantity": "3506.37"},
                {"Name": "Axis Bluechip Fund Direct Growth", "Type": "Mutual Fund", "Value": "168000", "DateUpdated": "2024-01-01", "Quantity": "2474.85"},
                {"Name": "ICICI Prudential Bluechip Fund Direct Growth", "Type": "Mutual Fund", "Value": "184000", "DateUpdated": "2024-01-01", "Quantity": "2061.94"}
            ]
        })

# MongoDB-powered stock endpoints
from database.mongo_manager import get_all_stocks, get_stock_by_symbol

@app.route('/stocks', methods=['GET'])
def get_all_stocks_endpoint():
    """Get all available stocks"""
    try:
        stocks = get_all_stocks()
        return jsonify({"stocks": stocks})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/stock/<symbol>', methods=['GET'])
def get_stock_endpoint(symbol):
    """Get specific stock by symbol"""
    try:
        stock = get_stock_by_symbol(symbol)
        if stock:
            return jsonify({"stock": stock})
        else:
            return jsonify({"error": "Stock not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/user-portfolio', methods=['GET'])
def get_user_portfolio():
    """Get comprehensive user portfolio data from MongoDB using email"""
    from database.mongo_manager import find_user_by_email
    try:
        user_email = request.args.get('email')
        if not user_email:
            return jsonify({"error": "Missing user email"}), 400
        # Only the demo user email should surface portfolio data
        if user_email.strip().lower() != 'vedehi@gmail.com':
            return jsonify({
                "user": {"email": user_email, "name": user_email},
                "assets": [],
                "liabilities": [],
                "income": [],
                "expenses": [],
                "goals": [],
                "risk_profile": {},
                "bank_accounts": [],
                "portfolio_allocation": {}
            })

        user = find_user_by_email(user_email)
        if not user:
            return jsonify({"error": "User not found"}), 404
        portfolio = {
            "user": {
                "email": user.get('email'),
                "name": user.get('name'),
            },
            "assets": user.get('assets', []),
            "liabilities": user.get('liabilities', []),
            "income": user.get('income_sources', user.get('income', [])),
            "expenses": user.get('expenses', []),
            "goals": user.get('financial_goals', user.get('goals', [])),
            "risk_profile": user.get('risk_profile', {}),
            "bank_accounts": user.get('bank_accounts', []),
            "portfolio_allocation": user.get('portfolio_allocation', {})
        }
        return jsonify(portfolio)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/demo-users', methods=['GET'])
def get_demo_users():
    """Get all demo users for testing"""
    from database.mongo_manager import get_users_collection
    try:
        # Find all users with is_demo_user flag set to true
        users = get_users_collection().find(
            {"is_demo_user": True}, 
            {"_id": 0, "password_hash": 0}  # Exclude sensitive fields
        )
        return jsonify({"demo_users": list(users)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# MongoDB-powered stock analysis endpoints
from database.mongo_manager import get_stock_by_symbol, get_stock_analysis

@app.route('/stock-analysis/<symbol>', methods=['GET'])
def get_stock_analysis_endpoint(symbol):
    """Get comprehensive stock analysis for a symbol"""
    try:
        # Get stock
        stock = get_stock_by_symbol(symbol.upper())
        if not stock:
            return jsonify({"error": "Stock not found"}), 404
        
        # Get all analysis for this stock
        analyses = get_stock_analysis(symbol.upper())
        
        if not analyses:
            return jsonify({"error": "No analysis data available for this stock"}), 404
        
        # Format response
        analysis_data = {}
        for analysis in analyses:
            analysis_type = analysis.get('type')
            analysis_data[analysis_type] = {
                'title': analysis.get('title'),
                'result': analysis.get('result'),
                'chartData': analysis.get('chart_data', []),
                'confidence': analysis.get('confidence_score'),
                'recommendation': analysis.get('recommendation'),
                'target_price': analysis.get('target_price'),
                'display_name': analysis.get('display_name'),
                'description': analysis.get('description'),
                'icon_name': analysis.get('icon_name'),
                'color': analysis.get('color'),
                'last_updated': analysis.get('timestamp')
            }
        
        return jsonify({
            "stock": {
                "symbol": stock['symbol'],
                "company_name": stock.get('company_name'),
                "current_price": stock.get('current_price'),
                "sector": stock.get('sector')
            },
            "comprehensive": True,
            "analyses": analysis_data
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/stock-analysis/<symbol>/<analysis_type>', methods=['GET'])
def get_specific_stock_analysis_endpoint(symbol, analysis_type):
    """Get specific type of analysis for a stock"""
    try:
        # Get stock
        stock = get_stock_by_symbol(symbol.upper())
        if not stock:
            return jsonify({"error": "Stock not found"}), 404
        
        # Get all analyses and filter for the specific type
        analyses = get_stock_analysis(symbol.upper())
        if not analyses:
            return jsonify({"error": f"No analysis available for this stock"}), 404
            
        # Find the specific analysis type
        analysis = next((a for a in analyses if a.get('type') == analysis_type.lower()), None)
        if not analysis:
            return jsonify({"error": f"No {analysis_type} analysis available for this stock"}), 404
        
        return jsonify({
            "stock": {
                "symbol": stock['symbol'],
                "company_name": stock.get('company_name'),
                "current_price": stock.get('current_price'),
                "sector": stock.get('sector')
            },
            "analysis": {
                'type': analysis.get('type'),
                'title': analysis.get('title'),
                'result': analysis.get('result'),
                'chartData': analysis.get('chart_data', []),
                'confidence': analysis.get('confidence_score'),
                'recommendation': analysis.get('recommendation'),
                'target_price': analysis.get('target_price'),
                'display_name': analysis.get('display_name'),
                'description': analysis.get('description'),
                'icon_name': analysis.get('icon_name'),
                'color': analysis.get('color'),
                'last_updated': analysis.get('timestamp')
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/popular-stocks', methods=['GET'])
def get_popular_stocks():
    """Get list of popular stocks with analysis availability"""
    from database.mongo_manager import get_all_popular_stocks
    try:
        popular_stocks = get_all_popular_stocks()
        return jsonify({"popular_stocks": popular_stocks})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/analysis-types', methods=['GET'])
def get_analysis_types():
    """Get all available analysis types"""
    from database.mongo_manager import get_all_analysis_types
    try:
        analysis_types = get_all_analysis_types()
        return jsonify({"analysis_types": analysis_types})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting WealthWise Backend with Database Integration...")
    print("📊 Database: MongoDB Atlas with comprehensive demo data")
    print("🔗 Available at: http://localhost:5000")
    app.run(debug=False, port=5000)