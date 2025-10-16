# MongoDB connection setup for WealthWise backend
from dotenv import load_dotenv
import os
from pymongo import MongoClient
from datetime import datetime

load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")
client = MongoClient(MONGODB_URI)
db = client["wealthwise"]

# Collection getters
def get_users_collection():
    return db["users"]

# Example: insert a user
def insert_user(user_data):
    users = get_users_collection()
    return users.insert_one(user_data)

# Example: find user by email
def find_user_by_email(email):
    users = get_users_collection()
    return users.find_one({"email": email})

def get_stocks_collection():
    return db["stocks"]

def get_stock_analysis_collection():
    return db["stock_analysis"]

def get_chatbot_conversations_collection():
    return db["chatbot_conversations"]

# Stock operations
def insert_stock(stock_data):
    stocks = get_stocks_collection()
    return stocks.insert_one(stock_data)

def update_stock(symbol, stock_data):
    stocks = get_stocks_collection()
    return stocks.update_one({"symbol": symbol}, {"$set": stock_data})

def get_all_stocks():
    stocks = get_stocks_collection()
    return list(stocks.find({}, {"_id": 0}))

def get_stock_by_symbol(symbol):
    stocks = get_stocks_collection()
    return stocks.find_one({"symbol": symbol}, {"_id": 0})

# Stock analysis operations
def insert_stock_analysis(analysis_data):
    analysis = get_stock_analysis_collection()
    analysis_data["timestamp"] = datetime.utcnow()
    return analysis.insert_one(analysis_data)

def get_stock_analysis(symbol):
    analysis = get_stock_analysis_collection()
    return list(analysis.find(
        {"symbol": symbol},
        {"_id": 0}
    ).sort("timestamp", -1))

# Analysis type operations
def get_analysis_types_collection():
    return db["analysis_types"]

def get_all_analysis_types():
    types = get_analysis_types_collection()
    return list(types.find({}, {"_id": 0}))

# Popular stocks operations
def get_popular_stocks_collection():
    return db["popular_stocks"]

def get_all_popular_stocks():
    popular = get_popular_stocks_collection()
    # Join with stocks collection to get full stock details
    pipeline = [
        {
            "$lookup": {
                "from": "stocks",
                "localField": "symbol",
                "foreignField": "symbol",
                "as": "stock_details"
            }
        },
        {
            "$unwind": "$stock_details"
        },
        {
            "$lookup": {
                "from": "stock_analysis",
                "localField": "symbol",
                "foreignField": "symbol",
                "as": "analysis"
            }
        },
        {
            "$project": {
                "_id": 0,
                "symbol": 1,
                "company_name": "$stock_details.company_name",
                "current_price": "$stock_details.current_price",
                "sector": "$stock_details.sector",
                "display_order": 1,
                "is_featured": 1,
                "category": 1,
                "analysis_count": {"$size": "$analysis"}
            }
        },
        {
            "$sort": {"display_order": 1}
        }
    ]
    return list(popular.aggregate(pipeline))

# Chatbot operations
def save_chatbot_conversation(conversation_data):
    conversations = get_chatbot_conversations_collection()
    conversation_data["timestamp"] = datetime.utcnow()
    return conversations.insert_one(conversation_data)
