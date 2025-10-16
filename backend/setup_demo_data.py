from dotenv import load_dotenv
import os
from pymongo import MongoClient, ASCENDING
from datetime import datetime

def setup_demo_data():
    print("🚀 Setting up WealthWise Demo Data...")
    
    load_dotenv()
    MONGODB_URI = os.getenv("MONGODB_URI")
    
    try:
        client = MongoClient(MONGODB_URI)
        db = client["wealthwise"]
        
        # Create collections
        print("\n1. Creating collections...")
        stocks = db["stocks"]
        stock_analysis = db["stock_analysis"]
        users = db["users"]
        
        # Demo User with Bank & MF Data
        print("\n2. Adding demo user data...")
        demo_user = {
            "email": "vedehi@gmail.com",
            "name": "Vedehi",
            "bank_accounts": [
                {
                    "bank_name": "SBI",
                    "account_type": "Savings",
                    "current_balance": 850000,
                    "date_updated": "2024-01-01"
                },
                {
                    "bank_name": "HDFC",
                    "account_type": "Current",
                    "current_balance": 250000,
                    "date_updated": "2024-01-01"
                }
            ],
            "assets": [
                {
                    "name": "Nippon India Large Cap Fund Direct Growth",
                    "type": "Mutual Fund",
                    "current_value": 275000,
                    "date_updated": "2024-01-01",
                    "quantity": "3506.37"
                },
                {
                    "name": "Axis Bluechip Fund Direct Growth",
                    "type": "Mutual Fund",
                    "current_value": 168000,
                    "date_updated": "2024-01-01",
                    "quantity": "2474.85"
                },
                {
                    "name": "ICICI Prudential Bluechip Fund Direct Growth",
                    "type": "Mutual Fund",
                    "current_value": 184000,
                    "date_updated": "2024-01-01",
                    "quantity": "2061.94"
                }
            ]
        }
        users.update_one({"email": demo_user["email"]}, {"$set": demo_user}, upsert=True)
        print("  ✅ Demo user created")

        # Demo Stocks
        print("\n3. Adding demo stocks...")
        demo_stocks = [
            {
                "symbol": "ADANIGREEN.NS",
                "company_name": "Adani Green Energy",
                "current_price": 1156.30,
                "sector": "Renewable Energy",
                "range_low": 1145,
                "range_high": 1168,
                "volume": "2.1M",
                "change_percent": 2.3
            },
            {
                "symbol": "TCS.NS",
                "company_name": "Tata Consultancy Services",
                "current_price": 3890.25,
                "sector": "Information Technology",
                "technical_rating": "BUY",
                "fundamental_score": "Strong",
                "risk_level": "Moderate",
                "target_price": 4200
            },
            {
                "symbol": "RELIANCE.NS",
                "company_name": "Reliance Industries",
                "current_price": 2450.75,
                "sector": "Oil & Gas",
                "market_cap": "16.6L Cr",
                "pe_ratio": 28.5,
                "recommendation": "HOLD",
                "target_price": 2600
            }
        ]
        for stock in demo_stocks:
            stocks.update_one({"symbol": stock["symbol"]}, {"$set": stock}, upsert=True)
        print("  ✅ Demo stocks created")

        # Demo Stock Analysis
        print("\n4. Adding demo stock analysis...")
        demo_analyses = [
            {
                "symbol": "ADANIGREEN.NS",
                "type": "technical",
                "title": "Technical Analysis",
                "result": "Strong upward momentum with support at ₹1,145",
                "chart_data": [],
                "confidence_score": 0.85,
                "recommendation": "BUY",
                "target_price": 1250,
                "timestamp": datetime.utcnow()
            },
            {
                "symbol": "TCS.NS",
                "type": "comprehensive",
                "title": "Company Analysis",
                "result": "Strong Q2 results, digital transformation growth, good margin expansion prospects",
                "chart_data": [],
                "confidence_score": 0.9,
                "recommendation": "BUY",
                "target_price": 4200,
                "timestamp": datetime.utcnow()
            },
            {
                "symbol": "RELIANCE.NS",
                "type": "comprehensive",
                "title": "Company Analysis",
                "result": "Diversified conglomerate with strong fundamentals. Retail & telecom growth offsetting oil volatility",
                "chart_data": [],
                "confidence_score": 0.8,
                "recommendation": "HOLD",
                "target_price": 2600,
                "timestamp": datetime.utcnow()
            }
        ]
        for analysis in demo_analyses:
            stock_analysis.update_one(
                {"symbol": analysis["symbol"], "type": analysis["type"]},
                {"$set": analysis},
                upsert=True
            )
        print("  ✅ Demo stock analyses created")

        # Print collection statistics
        print("\n5. Collection Statistics:")
        for collection_name in ["users", "stocks", "stock_analysis"]:
            count = db[collection_name].count_documents({})
            print(f"  - {collection_name}: {count} documents")

        print("\n✅ Demo data setup completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error setting up demo data: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    setup_demo_data()