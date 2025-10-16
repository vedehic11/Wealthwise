from dotenv import load_dotenv
import os
from pymongo import MongoClient, ASCENDING
from datetime import datetime

def setup_database():
    print("🚀 Setting up WealthWise Database...")
    
    # Load environment variables
    load_dotenv()
    MONGODB_URI = os.getenv("MONGODB_URI")
    
    try:
        # Connect to MongoDB
        client = MongoClient(MONGODB_URI)
        db = client["wealthwise"]
        
        # Create collections with indexes
        print("\n1. Creating collections and indexes...")
        
        # Users collection
        users = db["users"]
        users.create_index([("email", ASCENDING)], unique=True)
        print("  ✅ Users collection created")
        
        # Stocks collection
        stocks = db["stocks"]
        stocks.create_index([("symbol", ASCENDING)], unique=True)
        print("  ✅ Stocks collection created")
        
        # Stock analysis collection
        stock_analysis = db["stock_analysis"]
        stock_analysis.create_index([("symbol", ASCENDING)])
        print("  ✅ Stock analysis collection created")
        
        # Analysis types collection
        analysis_types = db["analysis_types"]
        analysis_types.create_index([("type_name", ASCENDING)], unique=True)
        print("  ✅ Analysis types collection created")
        
        # Popular stocks collection
        popular_stocks = db["popular_stocks"]
        popular_stocks.create_index([("symbol", ASCENDING)], unique=True)
        print("  ✅ Popular stocks collection created")
        
        # Chatbot conversations collection
        chatbot_conversations = db["chatbot_conversations"]
        chatbot_conversations.create_index([("timestamp", ASCENDING)])
        print("  ✅ Chatbot conversations collection created")
        
        # Insert demo data
        print("\n2. Adding demo data...")
        
        # Demo user
        demo_user = {
            "email": "vedehi@gmail.com",
            "name": "Vedehi",
            "is_demo_user": True,
            "assets": [
                {
                    "name": "Nippon India Large Cap Fund Direct Growth",
                    "type": "Mutual Fund",
                    "current_value": 275000,
                    "quantity": 3506.37,
                    "date_updated": "2024-01-01"
                }
            ],
            "bank_accounts": [
                {
                    "bank_name": "SBI",
                    "account_type": "savings",
                    "current_balance": 850000,
                    "date_updated": "2024-01-01"
                }
            ],
            "goals": [
                {
                    "name": "Home Purchase",
                    "target_amount": 5000000,
                    "target_date": "2027-01-01"
                }
            ],
            "risk_profile": {
                "score": 7,
                "category": "Aggressive",
                "last_updated": "2024-01-01"
            }
        }
        users.update_one({"email": demo_user["email"]}, {"$set": demo_user}, upsert=True)
        print("  ✅ Demo user created")
        
        # Demo stocks
        demo_stocks = [
            {
                "symbol": "ADANIGREEN.NS",
                "company_name": "Adani Green Energy",
                "current_price": 1156.30,
                "sector": "Renewable Energy"
            },
            {
                "symbol": "TCS.NS",
                "company_name": "Tata Consultancy Services",
                "current_price": 3890.25,
                "sector": "Information Technology"
            },
            {
                "symbol": "RELIANCE.NS",
                "company_name": "Reliance Industries",
                "current_price": 2450.75,
                "sector": "Conglomerate"
            }
        ]
        for stock in demo_stocks:
            stocks.update_one({"symbol": stock["symbol"]}, {"$set": stock}, upsert=True)
        print("  ✅ Demo stocks created")
        
        # Demo analysis types
        demo_analysis_types = [
            {
                "type_name": "technical",
                "display_name": "Technical Analysis",
                "description": "Analysis based on price movements and trading patterns",
                "icon_name": "chart-line",
                "color": "blue"
            },
            {
                "type_name": "fundamental",
                "display_name": "Fundamental Analysis",
                "description": "Analysis based on company financials and business metrics",
                "icon_name": "building",
                "color": "green"
            }
        ]
        for analysis_type in demo_analysis_types:
            analysis_types.update_one(
                {"type_name": analysis_type["type_name"]}, 
                {"$set": analysis_type}, 
                upsert=True
            )
        print("  ✅ Demo analysis types created")
        
        # Demo stock analysis
        demo_stock_analysis = [
            {
                "symbol": "ADANIGREEN.NS",
                "type": "technical",
                "title": "Technical Analysis - Adani Green",
                "result": "Bullish trend with strong momentum",
                "confidence_score": 0.85,
                "recommendation": "BUY",
                "target_price": 1250.00,
                "timestamp": datetime.utcnow()
            }
        ]
        for analysis in demo_stock_analysis:
            stock_analysis.update_one(
                {"symbol": analysis["symbol"], "type": analysis["type"]},
                {"$set": analysis},
                upsert=True
            )
        print("  ✅ Demo stock analysis created")
        
        # Popular stocks
        demo_popular_stocks = [
            {
                "symbol": "ADANIGREEN.NS",
                "display_order": 1,
                "is_featured": True,
                "category": "Renewable Energy"
            },
            {
                "symbol": "TCS.NS",
                "display_order": 2,
                "is_featured": True,
                "category": "Technology"
            }
        ]
        for pop_stock in demo_popular_stocks:
            popular_stocks.update_one(
                {"symbol": pop_stock["symbol"]},
                {"$set": pop_stock},
                upsert=True
            )
        print("  ✅ Demo popular stocks created")
        
        print("\n✅ Database setup completed successfully!")
        
        # Print collection statistics
        print("\n3. Collection Statistics:")
        for collection_name in db.list_collection_names():
            count = db[collection_name].count_documents({})
            print(f"  - {collection_name}: {count} documents")
        
    except Exception as e:
        print(f"\n❌ Error setting up database: {str(e)}")
        return False
    
    return True

if __name__ == "__main__":
    setup_database()