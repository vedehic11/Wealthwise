import datetime
from langchain.agents import tool
from dotenv import load_dotenv
import os
import json

load_dotenv()

@tool
def add(a: int, b: int) -> int:
    """Adds two numbers together"""
    return a + b

@tool
def subtract(a: int, b: int) -> int:
    """Subtracts the second number from the first number"""
    return a - b

@tool
def multiply(a: int, b: int) -> int:
    """Multiplies two numbers together"""
    return a * b

@tool
def divide(a: int, b: int) -> float:
    """Divides the first number by the second number"""
    if b != 0:
        return a / b
    else:
        return "Cannot divide by zero"

@tool
def power(a: int, b: int) -> int:
    """Raises the first number to the power of the second number"""
    return a ** b

@tool
def calculate_net_worth(financial_data: str) -> str:
    """Calculate user's net worth from their financial data."""
    try:
        data = json.loads(financial_data)
        
        total_assets = sum(asset.get('value', 0) for asset in data.get('assets', []))
        total_liabilities = sum(liability.get('value', 0) for liability in data.get('liabilities', []))
        
        net_worth = total_assets - total_liabilities
        
        return f"Net Worth Analysis:\n• Total Assets: ₹{total_assets:,.2f}\n• Total Liabilities: ₹{total_liabilities:,.2f}\n• Net Worth: ₹{net_worth:,.2f}\n\nYour financial position is {'strong' if net_worth > 1000000 else 'developing' if net_worth > 0 else 'needs attention'}."
    except Exception as e:
        return f"Error calculating net worth: {str(e)}"

@tool
def analyze_cash_flow(financial_data: str) -> str:
    """Analyze monthly cash flow from income and expenses."""
    try:
        data = json.loads(financial_data)
        
        monthly_income = sum(income.get('amount', 0) for income in data.get('incomes', []) if income.get('frequency') == 'monthly')
        annual_income = sum(income.get('amount', 0) for income in data.get('incomes', []) if income.get('frequency') == 'yearly')
        monthly_income += annual_income / 12
        
        monthly_expenses = sum(expense.get('amount', 0) for expense in data.get('expenses', []))
        
        cash_flow = monthly_income - monthly_expenses
        savings_rate = (cash_flow / monthly_income * 100) if monthly_income > 0 else 0
        
        return f"Cash Flow Analysis:\n• Monthly Income: ₹{monthly_income:,.2f}\n• Monthly Expenses: ₹{monthly_expenses:,.2f}\n• Monthly Surplus: ₹{cash_flow:,.2f}\n• Savings Rate: {savings_rate:.1f}%\n\n{'Excellent savings!' if savings_rate > 20 else 'Consider increasing savings' if savings_rate > 10 else 'Critical: Improve cash flow management'}"
    except Exception as e:
        return f"Error analyzing cash flow: {str(e)}"

@tool
def analyze_asset_allocation(financial_data: str) -> str:
    """Analyze the user's asset allocation and provide investment insights."""
    try:
        data = json.loads(financial_data)
        
        assets = data.get('assets', [])
        total_investment_value = sum(asset.get('value', 0) for asset in assets)
        
        allocation = {}
        for asset in assets:
            category = asset.get('category', 'other')
            value = asset.get('value', 0)
            allocation[category] = allocation.get(category, 0) + value
        
        allocation_percentages = {k: (v/total_investment_value*100) if total_investment_value > 0 else 0 for k, v in allocation.items()}
        
        # Investment advice based on allocation
        advice = []
        if allocation_percentages.get('bank', 0) > 50:
            advice.append("Consider moving some savings to higher-return investments")
        if allocation_percentages.get('investments', 0) < 30:
            advice.append("Consider increasing equity investments for long-term growth")
        if allocation_percentages.get('realestate', 0) > 40:
            advice.append("Real estate allocation seems high - consider diversifying")
            
        result = f"Asset Allocation Analysis:\n• Portfolio Value: ₹{total_investment_value:,.2f}\n\nAllocation:\n"
        for category, percentage in allocation_percentages.items():
            result += f"• {category.title()}: {percentage:.1f}% (₹{allocation[category]:,.2f})\n"
        
        if advice:
            result += f"\nRecommendations:\n" + "\n".join(f"• {tip}" for tip in advice)
        else:
            result += "\n✅ Well-diversified portfolio!"
            
        return result
    except Exception as e:
        return f"Error analyzing asset allocation: {str(e)}"

@tool
def goal_progress_analysis(financial_data: str) -> str:
    """Analyze progress towards financial goals."""
    try:
        data = json.loads(financial_data)
        
        goals = data.get('goals', [])
        
        # Calculate available surplus from cash flow
        monthly_income = sum(income.get('amount', 0) for income in data.get('incomes', []) if income.get('frequency') == 'monthly')
        annual_income = sum(income.get('amount', 0) for income in data.get('incomes', []) if income.get('frequency') == 'yearly')
        monthly_income += annual_income / 12
        monthly_expenses = sum(expense.get('amount', 0) for expense in data.get('expenses', []))
        monthly_surplus = monthly_income - monthly_expenses
        
        result = f"Goal Progress Analysis:\nAvailable Monthly Surplus: ₹{monthly_surplus:,.0f}\n\n"
        
        for i, goal in enumerate(goals, 1):
            target_amount = goal.get('targetAmount', 0)
            current_amount = goal.get('currentAmount', 0)
            remaining = target_amount - current_amount
            progress = (current_amount / target_amount * 100) if target_amount > 0 else 0
            
            result += f"Goal {i}: {goal.get('title', 'Unnamed Goal')}\n"
            result += f"• Progress: {progress:.1f}% (₹{current_amount:,.0f} / ₹{target_amount:,.0f})\n"
            result += f"• Remaining: ₹{remaining:,.0f}\n"
            
            if goal.get('targetDate'):
                try:
                    target_date = goal['targetDate'].split('T')[0]
                    target_dt = datetime.datetime.strptime(target_date, '%Y-%m-%d')
                    months_remaining = max(1, (target_dt.year - datetime.datetime.now().year) * 12 + target_dt.month - datetime.datetime.now().month)
                    monthly_needed = remaining / months_remaining
                    
                    result += f"• Monthly requirement: ₹{monthly_needed:,.0f}\n"
                    result += f"• Feasibility: {'✅ Achievable' if monthly_needed <= monthly_surplus else '⚠️ Challenging - consider increasing income or extending timeline'}\n"
                except:
                    result += "• Set a specific target date for better planning\n"
            
            result += "\n"
        
        return result
    except Exception as e:
        return f"Error analyzing goals: {str(e)}"

@tool
def investment_recommendations(financial_data: str) -> str:
    """Provide investment recommendations based on risk tolerance and current portfolio."""
    try:
        data = json.loads(financial_data)
        
        risk_tolerance = data.get('riskTolerance', {})
        risk_score = risk_tolerance.get('score', 50)
        time_horizon = risk_tolerance.get('timeHorizon', 'medium')
        risk_capacity = risk_tolerance.get('riskCapacity', 'moderate')
        
        # Analyze current allocation
        assets = data.get('assets', [])
        total_value = sum(asset.get('value', 0) for asset in assets)
        
        allocation = {}
        for asset in assets:
            category = asset.get('category', 'other')
            value = asset.get('value', 0)
            allocation[category] = allocation.get(category, 0) + value
        
        bank_pct = (allocation.get('bank', 0) / total_value * 100) if total_value > 0 else 0
        investment_pct = (allocation.get('investments', 0) / total_value * 100) if total_value > 0 else 0
        
        result = f"Investment Recommendations:\n"
        result += f"Risk Profile: {risk_capacity.title()} ({risk_score}/100)\n"
        result += f"Time Horizon: {time_horizon.title()}-term\n\n"
        
        recommendations = []
        
        # Risk-based recommendations
        if risk_score < 30:  # Conservative
            recommendations.append("Focus on debt funds, FDs, and government bonds (70-80%)")
            recommendations.append("Limited equity exposure through index funds (10-20%)")
            recommendations.append("Prioritize capital preservation over growth")
        elif risk_score > 70:  # Aggressive
            recommendations.append("Increase equity allocation to 70-80% for higher growth")
            recommendations.append("Consider sectoral funds and mid/small-cap exposure")
            recommendations.append("Explore international diversification (10-15%)")
        else:  # Moderate
            recommendations.append("Maintain balanced 60% equity, 40% debt allocation")
            recommendations.append("Focus on large-cap and diversified equity funds")
            recommendations.append("Include some mid-cap exposure for growth (10-15%)")
        
        # Current allocation adjustments
        if bank_pct > 40:
            recommendations.append(f"Move excess bank savings ({bank_pct:.0f}%) to debt mutual funds")
        if investment_pct < 30:
            recommendations.append("Gradually increase equity investments through SIPs")
        
        # Time horizon specific advice
        if time_horizon == 'short':
            recommendations.append("Focus on liquid funds and short-term debt for immediate goals")
        elif time_horizon == 'long':
            recommendations.append("Emphasize equity investments for long-term wealth creation")
            recommendations.append("Consider ELSS funds for tax benefits")
        
        for i, rec in enumerate(recommendations, 1):
            result += f"{i}. {rec}\n"
        
        return result
    except Exception as e:
        return f"Error generating recommendations: {str(e)}"

@tool
def search(query: str) -> str:
    """Searches the web using DuckDuckGo for the given query."""
    try:
        from ddgs import DDGS
        with DDGS() as ddgs:
            results = []
            for r in ddgs.text(query, max_results=3):
                results.append(f"Title: {r['title']}\nURL: {r['href']}\nSnippet: {r['body']}\n")
        return "\n".join(results) if results else "No results found"
    except Exception as e:
        # Fallback to demo data if search fails
        return f"Search service temporarily unavailable. Please try a more specific query or ask about popular stocks like Apple, Microsoft, Google, Tesla, etc."

@tool
def repl_tool(code: str) -> str:
    """Execute Python code and return the result."""
    try:
        # Handle multiple statements by using exec and capturing output
        import io
        import sys
        
        # Capture output
        old_stdout = sys.stdout
        sys.stdout = buffer = io.StringIO()
        
        # Execute the code
        exec(code)
        
        # Get the output
        output = buffer.getvalue()
        sys.stdout = old_stdout
        
        return output if output else "Code executed successfully (no output)"
    except Exception as e:
        return f"Error: {str(e)}"

@tool
def calculate_return(prices: str) -> str:
    """Calculate percentage return between two prices. Input format: 'old_price,new_price' or 'old_price new_price'."""
    try:
        # Handle both comma and space separated values
        if "," in prices:
            old_price, new_price = prices.split(",")
        else:
            parts = prices.split()
            if len(parts) >= 2:
                old_price, new_price = parts[0], parts[1]
            else:
                return "Please provide two prices in format: 'old_price,new_price'"
        
        old_price = float(old_price.strip())
        new_price = float(new_price.strip())
        
        return_pct = ((new_price - old_price) / old_price) * 100
        
        return f"Return calculation:\nOld price: {old_price}\nNew price: {new_price}\nReturn: {return_pct:.2f}%"
    except Exception as e:
        return f"Error calculating return: {str(e)}"

@tool
def check_system_time(format: str = "%Y-%m-%d %H:%M:%S") -> str:
    """Returns the current date and time in the specified format"""
    current_time = datetime.datetime.now()
    formatted_time = current_time.strftime(format)
    return formatted_time

def get_ticker_from_company(company_name: str) -> str:
    """Helper function to get ticker symbol from company name"""
    company_ticker_map = {
        "apple": "AAPL", "microsoft": "MSFT", "google": "GOOGL", "alphabet": "GOOGL",
        "amazon": "AMZN", "tesla": "TSLA", "meta": "META", "facebook": "META",
        "nvidia": "NVDA", "netflix": "NFLX", "uber": "UBER", "airbnb": "ABNB",
        "zoom": "ZM", "salesforce": "CRM", "paypal": "PYPL", "intel": "INTC",
        "amd": "AMD", "oracle": "ORCL", "adobe": "ADBE", "cisco": "CSCO",
        "ibm": "IBM", "twitter": "X", "x": "X", "snapchat": "SNAP",
        "spotify": "SPOT", "square": "SQ", "block": "SQ", "coinbase": "COIN"
    }
    company_lower = company_name.lower().strip()
    return company_ticker_map.get(company_lower, company_name.upper())

@tool
def get_current_price(company_name: str) -> str:
    """Get the current price of a stock using web search and AI analysis."""
    try:
        ticker = get_ticker_from_company(company_name)
        search_query = f"{company_name} {ticker} stock price today current NSE BSE"
        search_results = search(search_query)
        
        # Use direct Gemini to extract price from search results
        try:
            import sys
            import os
            sys.path.append(os.path.dirname(os.path.dirname(__file__)))
            from gemini_direct import get_direct_gemini_response
            
            analysis_prompt = f"""Extract the current stock price from these search results for {company_name}:

{search_results}

Give ONLY the current price in this format: "₹XXX.XX" or "Current price: ₹XXX.XX" if you find it.
If you can't find an exact price, say "Price not found in search results"."""
            
            price_response = get_direct_gemini_response(analysis_prompt)
            if "₹" in price_response or "Current price" in price_response:
                return price_response
            else:
                return f"Current stock price search for {company_name} ({ticker}):\n{search_results[:500]}..."
        except:
            return f"Current stock price for {company_name} ({ticker}):\n{search_results}"
    except Exception as e:
        return f"Unable to fetch real-time price for {company_name}. Please check if the company name is correct and try again. Error: {str(e)}"

@tool
def get_company_info(company_name: str) -> str:
    """Retrieve company information using web search."""
    try:
        ticker = get_ticker_from_company(company_name)
        search_query = f"{company_name} {ticker} company information market cap"
        search_results = search(search_query)
        return f"Company info for {company_name} ({ticker}):\n{search_results}"
    except Exception as e:
        return f"Unable to fetch company info for {company_name}. Error: {str(e)}"

@tool
def get_historical_price(query: str) -> str:
    """Fetch historical stock prices using web search. Query can be 'company_name, start_date, duration' or just 'company_name duration'."""
    try:
        # Handle both formats: "company, date, duration" or "company duration"
        parts = query.split(",")
        if len(parts) >= 3:
            company_name, start_date, duration = parts[0].strip(), parts[1].strip(), parts[2].strip()
            search_query = f"{company_name} stock price history {start_date} {duration}"
        elif len(parts) == 2:
            company_name, duration = parts[0].strip(), parts[1].strip()
            search_query = f"{company_name} stock price {duration} performance"
        else:
            # Single input - assume it contains company name and time period
            search_query = f"{query} stock price history"
        
        search_results = search(search_query)
        return f"Historical stock data search results:\n{search_results}"
    except Exception as e:
        return f"Error fetching historical data: {str(e)}"

@tool
def evaluate_returns(inputs: str) -> str:
    """Calculate stock performance using web search."""
    try:
        company_name, duration = inputs.split(",")
        ticker = get_ticker_from_company(company_name.strip())
        search_query = f"{company_name} {ticker} stock performance {duration}"
        search_results = search(search_query)
        return f"Performance for {company_name}:\n{search_results}"
    except Exception as e:
        return f"Error calculating returns: {str(e)}"

@tool
def technical_analysis(company_name: str) -> str:
    """Perform technical analysis using web search."""
    try:
        ticker = get_ticker_from_company(company_name)
        search_query = f"{company_name} {ticker} technical analysis RSI MACD"
        search_results = search(search_query)
        return f"📊 Technical Analysis for {company_name} ({ticker}):\n{search_results}"
    except Exception as e:
        return f"Unable to fetch technical analysis for {company_name}. Please try again or check if the company name is correct. Error: {str(e)}"

@tool
def predict_stock_trend(company_name: str) -> str:
    """Predict stock trends using web search."""
    try:
        ticker = get_ticker_from_company(company_name)
        search_query = f"{company_name} {ticker} stock forecast prediction"
        search_results = search(search_query)
        return f"📈 Trend Prediction for {company_name} ({ticker}):\n{search_results}"
    except Exception as e:
        return f"Unable to fetch trend prediction for {company_name}. Please try again or check if the company name is correct. Error: {str(e)}"

@tool
def stock_sentiment_analysis(company_name: str) -> str:
    """Analyze stock sentiment using web search."""
    try:
        ticker = get_ticker_from_company(company_name)
        search_query = f"{company_name} {ticker} stock sentiment news"
        search_results = search(search_query)
        return f"😊 Sentiment Analysis for {company_name} ({ticker}):\n{search_results}"
    except Exception as e:
        return f"Unable to fetch sentiment analysis for {company_name}. Please try again or check if the company name is correct. Error: {str(e)}"