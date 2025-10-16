import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, BarChart3, Brain, Loader2, AlertCircle, DollarSign, Copy, ChevronDown, ChevronUp, LineChart } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const StockAnalyzer = () => {
  const [stockSymbol, setStockSymbol] = useState('');
    const [analysisData, setAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [collapsedCards, setCollapsedCards] = useState({});
  const [popularStocks, setPopularStocks] = useState([
    'Reliance Industries', 'TCS', 'Infosys', 'HDFC Bank', 'ICICI Bank',
    'Adani Green', 'Wipro', 'HCL Technologies', 'Axis Bank', 'Maruti Suzuki'
  ]);
  const resultsRef = useRef(null);

  // Do not auto-restore previous results; show results only after explicit Analyze

  const setAndPersistAnalysis = (data) => {
    setAnalysisData(data);
    try { localStorage.setItem('lastStockAnalysis', JSON.stringify(data)); } catch (_) {}
  };

  // Remove inner heading lines from demo text so we don't need to strip later
  const stripAnalysisHeadings = (text = '') => {
    return text
      .split('\n')
      .filter(line => !/^(TECHNICAL ANALYSIS FOR|TREND PREDICTION FOR|STOCK TREND PREDICTION FOR|SENTIMENT ANALYSIS FOR|FUNDAMENTAL ANALYSIS FOR)\b/i.test(line.trim()))
      .join('\n');
  };
  const sanitizeDemoAnalyses = (analyses) => ({
    technical: { ...analyses.technical, result: stripAnalysisHeadings(analyses.technical?.result) },
    prediction: { ...analyses.prediction, result: stripAnalysisHeadings(analyses.prediction?.result) },
    sentiment: { ...analyses.sentiment, result: stripAnalysisHeadings(analyses.sentiment?.result) },
    fundamental: { ...analyses.fundamental, result: stripAnalysisHeadings(analyses.fundamental?.result) },
    ...(analyses.diversification ? { diversification: analyses.diversification } : {})
  });

  // Keep a default popular list for demo; no API fetch to keep behavior fully hardcoded

  // Expanded analysis types with friendly labels and descriptions
  const analysisTypes = [
    {
      id: 'technical',
      label: 'Technical Analysis',
      icon: BarChart3,
      description: 'RSI, MACD, Moving Averages, Bollinger Bands',
      color: 'indigo'
    },
    {
      id: 'prediction',
      label: 'Trend Prediction',
      icon: TrendingUp,
      description: '5-10 day trend forecast with confidence',
      color: 'green'
    },
    {
      id: 'sentiment',
      label: 'Sentiment Analysis',
      icon: Brain,
      description: 'Market mood and sentiment indicators',
      color: 'purple'
    },
    {
      id: 'fundamental',
      label: 'Fundamental Analysis',
      icon: DollarSign,
      description: 'P/E, EPS, ROE, revenue trends and valuation',
      color: 'teal'
    }
  ];

  // Comprehensive demo data for all popular stocks across all analysis types
  const demoPresets = {
    'Reliance Industries': {
      technical: {
        title: 'Technical Analysis',
        result: `TECHNICAL ANALYSIS FOR Reliance Industries\n- Overall: NEUTRAL (Short-term)\n- Current Price: ₹2,845\n- 50-day MA: ₹2,800 (price above MA)\n- 200-day MA: ₹2,600 (long-term uptrend)\n- RSI(14): 58 (mildly bullish)\n- MACD: Bullish crossover observed 5 days ago\n- Support: ₹2,650 | Resistance: ₹2,950\nRecommendation: Hold for swing, consider buying on dips near support.`,
        chartData: [2500, 2600, 2650, 2700, 2750, 2800, 2850, 2820, 2870, 2900]
      },
      prediction: {
        title: 'Trend Prediction',
        result: `TREND PREDICTION FOR Reliance Industries\n- 7-day forecast: Mild uptrend expected\n- Expected move: +2% to +4%\n- Confidence: 68%\n- Key drivers: Oil refining margins, telecom growth\n- Risk factors: Global crude volatility\nStrategy: Accumulate on dips, target ₹3,000 in 2-3 weeks.`,
        chartData: [2845, 2860, 2880, 2895, 2920, 2940, 2965]
      },
      sentiment: {
        title: 'Market Sentiment',
        result: `SENTIMENT ANALYSIS FOR Reliance Industries\n- Social sentiment: Positive (67%)\n- News flow: Mixed-to-positive\n- Analyst coverage: 75% BUY ratings\n- Institutional activity: Net buying\n- Retail interest: High volume\nOverall: Cautiously optimistic with strong institutional backing.`,
        chartData: [3, 4, 3, 4, 4, 5, 4]
      },
      fundamental: {
        title: 'Fundamental Analysis',
        result: `FUNDAMENTAL ANALYSIS FOR Reliance Industries\n- P/E Ratio: 24.5 (sector avg: 22)\n- EPS (TTM): ₹116.2\n- Revenue Growth: 15% YoY\n- Debt-to-Equity: 0.35\n- ROE: 11.2%\n- Market Cap: ₹19.2L Cr\nConclusion: Fair valuation with strong growth prospects in digital.`,
        chartData: [15, 12, 11, 13, 15, 16, 15]
      },
      diversification: {
        title: 'Portfolio Allocation',
        result: `DIVERSIFICATION PLAN with Reliance (₹100,000)\n- Large Cap Equity (Reliance): ₹30,000\n- Other Large Caps: ₹25,000\n- Mid/Small Cap: ₹20,000\n- Debt/Bonds: ₹15,000\n- Gold/Commodities: ₹10,000\nRisk Level: Moderate • Expected Return: 12-15% annually`,
        chartData: [30, 25, 20, 15, 10]
      }
    },
    'TCS': {
      technical: {
        title: 'Technical Analysis',
        result: `TECHNICAL ANALYSIS FOR TCS\n- Overall: BULLISH (Short-term)\n- Current Price: ₹3,412\n- 50-day MA: ₹3,350 (strong support)\n- 200-day MA: ₹3,200 (uptrend intact)\n- RSI(14): 62 (bullish momentum)\n- MACD: Positive divergence\n- Support: ₹3,300 | Resistance: ₹3,500\nRecommendation: BUY on dips, target ₹3,600.`,
        chartData: [3200, 3250, 3300, 3350, 3380, 3412, 3450, 3480, 3520, 3550]
      },
      prediction: {
        title: 'Trend Prediction',
        result: `TREND PREDICTION FOR TCS\n- 7-day forecast: Strong uptrend\n- Expected move: +4% to +7%\n- Confidence: 78%\n- Key drivers: Q2 earnings beat, strong deal wins\n- Sector outlook: IT services demand robust\nStrategy: Accumulate, target ₹3,650 in 2-3 weeks.`,
        chartData: [3412, 3445, 3478, 3510, 3545, 3580, 3615]
      },
      sentiment: {
        title: 'Market Sentiment',
        result: `SENTIMENT ANALYSIS FOR TCS\n- Social sentiment: Very positive (82%)\n- News flow: Consistently positive\n- Analyst coverage: 85% BUY/STRONG BUY\n- FII activity: Strong buying\n- Options data: Bullish skew\nOverall: Very strong sentiment with institutional support.`,
        chartData: [4, 5, 4, 5, 5, 5, 4]
      },
      fundamental: {
        title: 'Fundamental Analysis',
        result: `FUNDAMENTAL ANALYSIS FOR TCS\n- P/E Ratio: 26.8 (premium to sector)\n- EPS (TTM): ₹127.3\n- Revenue Growth: 18% YoY\n- Operating Margin: 24.5%\n- ROE: 42.1%\n- Cash Reserves: ₹19,500 Cr\nConclusion: Premium valuation justified by consistent growth.`,
        chartData: [18, 20, 22, 24, 25, 24, 25]
      },
      diversification: {
        title: 'Portfolio Allocation',
        result: `DIVERSIFICATION PLAN with TCS (₹100,000)\n- IT Stocks (TCS focus): ₹35,000\n- Other Large Caps: ₹25,000\n- Banking/Finance: ₹20,000\n- Debt/Bonds: ₹15,000\n- International/Gold: ₹5,000\nRisk Level: Moderate-High • Expected Return: 14-18% annually`,
        chartData: [35, 25, 20, 15, 5]
      }
    },
    'Infosys': {
      technical: {
        title: 'Technical Analysis',
        result: `TECHNICAL ANALYSIS FOR Infosys\n- Overall: NEUTRAL-BULLISH\n- Current Price: ₹1,456\n- 50-day MA: ₹1,420 (trending up)\n- 200-day MA: ₹1,380 (long-term support)\n- RSI(14): 55 (neutral zone)\n- MACD: Early bullish signal\n- Support: ₹1,400 | Resistance: ₹1,500\nRecommendation: Watch for breakout above ₹1,500.`,
        chartData: [1380, 1400, 1420, 1435, 1456, 1470, 1485, 1500, 1515, 1530]
      },
      prediction: {
        title: 'Trend Prediction',
        result: `TREND PREDICTION FOR Infosys\n- 7-day forecast: Gradual uptrend\n- Expected move: +3% to +5%\n- Confidence: 72%\n- Key drivers: Digital transformation deals\n- Headwinds: Client budget constraints\nStrategy: Accumulate on weakness, target ₹1,550.`,
        chartData: [1456, 1470, 1485, 1500, 1515, 1530, 1545]
      },
      sentiment: {
        title: 'Market Sentiment',
        result: `SENTIMENT ANALYSIS FOR Infosys\n- Social sentiment: Positive (71%)\n- News flow: Mixed but improving\n- Analyst coverage: 70% BUY ratings\n- Management guidance: Conservative but stable\n- Peer comparison: Relatively attractive\nOverall: Cautiously positive with improving fundamentals.`,
        chartData: [3, 4, 3, 4, 4, 4, 4]
      },
      fundamental: {
        title: 'Fundamental Analysis',
        result: `FUNDAMENTAL ANALYSIS FOR Infosys\n- P/E Ratio: 22.4 (reasonable)\n- EPS (TTM): ₹65.1\n- Revenue Growth: 12% YoY\n- Operating Margin: 21.2%\n- ROE: 31.8%\n- Dividend Yield: 2.8%\nConclusion: Solid fundamentals with consistent dividend payments.`,
        chartData: [12, 14, 16, 18, 21, 22, 21]
      },
      diversification: {
        title: 'Portfolio Allocation',
        result: `DIVERSIFICATION PLAN with Infosys (₹100,000)\n- IT Sector (Infosys): ₹30,000\n- Banking/Finance: ₹25,000\n- Consumer/FMCG: ₹20,000\n- Debt/Fixed Income: ₹15,000\n- Commodities/Gold: ₹10,000\nRisk Level: Moderate • Expected Return: 12-16% annually`,
        chartData: [30, 25, 20, 15, 10]
      }
    },
    'HDFC Bank': {
      technical: {
        title: 'Technical Analysis',
        result: `TECHNICAL ANALYSIS FOR HDFC Bank\n- Overall: BULLISH\n- Current Price: ₹1,642\n- 50-day MA: ₹1,580 (strong momentum)\n- 200-day MA: ₹1,520 (uptrend)\n- RSI(14): 68 (bullish but overbought)\n- Volume: Above average\n- Support: ₹1,580 | Resistance: ₹1,700\nRecommendation: Hold positions, book profits near ₹1,700.`,
        chartData: [1520, 1550, 1580, 1610, 1642, 1665, 1680, 1695, 1710, 1725]
      },
      prediction: {
        title: 'Trend Prediction',
        result: `TREND PREDICTION FOR HDFC Bank\n- 7-day forecast: Continued uptrend\n- Expected move: +2% to +4%\n- Confidence: 75%\n- Key drivers: Credit growth, NIM expansion\n- Risk: RBI policy changes\nStrategy: Hold existing, add on corrections.`,
        chartData: [1642, 1658, 1670, 1685, 1695, 1705, 1720]
      },
      sentiment: {
        title: 'Market Sentiment',
        result: `SENTIMENT ANALYSIS FOR HDFC Bank\n- Social sentiment: Very positive (85%)\n- News flow: Strong quarterly results\n- Analyst coverage: 90% BUY ratings\n- Institutional holding: Increasing\n- Retail participation: High\nOverall: Extremely positive sentiment across all investor categories.`,
        chartData: [4, 5, 5, 5, 5, 4, 5]
      },
      fundamental: {
        title: 'Fundamental Analysis',
        result: `FUNDAMENTAL ANALYSIS FOR HDFC Bank\n- P/E Ratio: 18.9 (attractive)\n- P/B Ratio: 2.8\n- ROA: 2.1%\n- ROE: 16.8%\n- NIM: 4.2%\n- CASA Ratio: 42%\nConclusion: Strong fundamentals with consistent performance.`,
        chartData: [16, 17, 18, 19, 19, 18, 19]
      },
      diversification: {
        title: 'Portfolio Allocation',
        result: `DIVERSIFICATION PLAN with HDFC Bank (₹100,000)\n- Banking Sector (HDFC focus): ₹35,000\n- IT/Technology: ₹25,000\n- Consumer Goods: ₹20,000\n- Debt/Bonds: ₹15,000\n- International/REITs: ₹5,000\nRisk Level: Moderate • Expected Return: 13-17% annually`,
        chartData: [35, 25, 20, 15, 5]
      }
    },
    'ICICI Bank': {
      technical: {
        title: 'Technical Analysis',
        result: `TECHNICAL ANALYSIS FOR ICICI Bank\n- Overall: BULLISH\n- Current Price: ₹1,156\n- 50-day MA: ₹1,120 (trending up)\n- 200-day MA: ₹1,050 (strong uptrend)\n- RSI(14): 64 (bullish momentum)\n- Breakout: Above key resistance\n- Support: ₹1,100 | Resistance: ₹1,200\nRecommendation: BUY on dips, target ₹1,250.`,
        chartData: [1050, 1080, 1110, 1130, 1156, 1175, 1190, 1210, 1230, 1250]
      },
      prediction: {
        title: 'Trend Prediction',
        result: `TREND PREDICTION FOR ICICI Bank\n- 7-day forecast: Strong uptrend\n- Expected move: +3% to +6%\n- Confidence: 76%\n- Key drivers: Digital banking growth, cost efficiency\n- Tailwinds: Credit cycle upturn\nStrategy: Accumulate, target ₹1,300 medium-term.`,
        chartData: [1156, 1175, 1190, 1210, 1225, 1240, 1260]
      },
      sentiment: {
        title: 'Market Sentiment',
        result: `SENTIMENT ANALYSIS FOR ICICI Bank\n- Social sentiment: Positive (78%)\n- News flow: Strong earnings momentum\n- Analyst coverage: 80% BUY ratings\n- Management commentary: Confident outlook\n- Peer comparison: Outperforming\nOverall: Strong positive sentiment with growth visibility.`,
        chartData: [4, 4, 5, 4, 5, 5, 4]
      },
      fundamental: {
        title: 'Fundamental Analysis',
        result: `FUNDAMENTAL ANALYSIS FOR ICICI Bank\n- P/E Ratio: 15.2 (attractive)\n- P/B Ratio: 2.1\n- ROA: 2.3%\n- ROE: 18.1%\n- Credit Growth: 16%\n- Asset Quality: Improving\nConclusion: Strong fundamentals with improving asset quality.`,
        chartData: [14, 15, 16, 17, 18, 19, 18]
      },
      diversification: {
        title: 'Portfolio Allocation',
        result: `DIVERSIFICATION PLAN with ICICI Bank (₹100,000)\n- Private Banks (ICICI focus): ₹35,000\n- IT/Services: ₹25,000\n- Manufacturing: ₹20,000\n- Government Bonds: ₹15,000\n- Gold/Commodities: ₹5,000\nRisk Level: Moderate-High • Expected Return: 14-18% annually`,
        chartData: [35, 25, 20, 15, 5]
      }
    },
    'Adani Green': {
      technical: {
        title: 'Technical Analysis',
        result: `TECHNICAL ANALYSIS FOR Adani Green\n- Overall: VOLATILE-NEUTRAL\n- Current Price: ₹1,123\n- 50-day MA: ₹1,100 (choppy movement)\n- 200-day MA: ₹950 (long-term uptrend)\n- RSI(14): 52 (neutral)\n- High volatility: 35%\n- Support: ₹1,000 | Resistance: ₹1,250\nRecommendation: High risk-reward, position size carefully.`,
        chartData: [950, 1050, 1150, 1200, 1100, 1123, 1180, 1250, 1200, 1150]
      },
      prediction: {
        title: 'Trend Prediction',
        result: `TREND PREDICTION FOR Adani Green\n- 7-day forecast: Sideways with volatility\n- Expected move: -5% to +8%\n- Confidence: 55% (low due to volatility)\n- Key drivers: Green energy policies, project announcements\n- Risks: Regulatory changes, debt concerns\nStrategy: Only for high-risk investors.`,
        chartData: [1123, 1100, 1150, 1120, 1180, 1160, 1200]
      },
      sentiment: {
        title: 'Market Sentiment',
        result: `SENTIMENT ANALYSIS FOR Adani Green\n- Social sentiment: Mixed (55%)\n- News flow: Polarized coverage\n- Analyst coverage: 45% BUY, 55% HOLD/SELL\n- ESG focus: Positive for green energy\n- Volatility concerns: High\nOverall: Mixed sentiment with thematic play on renewables.`,
        chartData: [2, 3, 2, 4, 3, 4, 3]
      },
      fundamental: {
        title: 'Fundamental Analysis',
        result: `FUNDAMENTAL ANALYSIS FOR Adani Green\n- P/E Ratio: 85.4 (very high)\n- Debt-to-Equity: 2.8 (concerning)\n- Revenue Growth: 45% YoY\n- Capacity Addition: Strong pipeline\n- ESG Score: Improving\n- Sector Growth: 25%+ annually\nConclusion: High growth but expensive valuation and high debt.`,
        chartData: [25, 35, 45, 50, 40, 35, 45]
      },
      diversification: {
        title: 'Portfolio Allocation',
        result: `DIVERSIFICATION PLAN with Adani Green (₹100,000)\n- Green Energy (Adani Green): ₹15,000\n- Traditional Energy: ₹20,000\n- Large Cap Stable: ₹35,000\n- Debt/Fixed Income: ₹25,000\n- Gold: ₹5,000\nRisk Level: High • Max allocation: 15% due to volatility`,
        chartData: [15, 20, 35, 25, 5]
      }
    },
    'Wipro': {
      technical: {
        title: 'Technical Analysis',
        result: `TECHNICAL ANALYSIS FOR Wipro\n- Overall: NEUTRAL\n- Current Price: ₹412\n- 50-day MA: ₹405 (sideways trend)\n- 200-day MA: ₹395 (weak uptrend)\n- RSI(14): 48 (neutral)\n- Volume: Below average\n- Support: ₹390 | Resistance: ₹430\nRecommendation: Range-bound, wait for breakout.`,
        chartData: [395, 400, 405, 410, 412, 418, 425, 420, 415, 422]
      },
      prediction: {
        title: 'Trend Prediction',
        result: `TREND PREDICTION FOR Wipro\n- 7-day forecast: Sideways movement\n- Expected move: -2% to +3%\n- Confidence: 62%\n- Key drivers: Client wins in BFSI, cost optimization\n- Challenges: Margin pressure, competition\nStrategy: Conservative approach, wait for clear direction.`,
        chartData: [412, 415, 420, 418, 425, 422, 428]
      },
      sentiment: {
        title: 'Market Sentiment',
        result: `SENTIMENT ANALYSIS FOR Wipro\n- Social sentiment: Neutral (58%)\n- News flow: Mixed quarterly results\n- Analyst coverage: 50% HOLD, 30% BUY, 20% SELL\n- Management guidance: Conservative\n- Peer comparison: Lagging\nOverall: Neutral sentiment with execution focus needed.`,
        chartData: [3, 3, 2, 3, 3, 4, 3]
      },
      fundamental: {
        title: 'Fundamental Analysis',
        result: `FUNDAMENTAL ANALYSIS FOR Wipro\n- P/E Ratio: 20.1 (fair)\n- EPS (TTM): ₹20.5\n- Revenue Growth: 8% YoY\n- Operating Margin: 15.8%\n- ROE: 18.2%\n- Dividend Yield: 3.2%\nConclusion: Decent fundamentals but growth concerns persist.`,
        chartData: [8, 10, 12, 15, 16, 15, 16]
      },
      diversification: {
        title: 'Portfolio Allocation',
        result: `DIVERSIFICATION PLAN with Wipro (₹100,000)\n- IT Services (Wipro): ₹25,000\n- Other IT/Tech: ₹25,000\n- Banking/Finance: ₹25,000\n- Debt/Bonds: ₹20,000\n- Commodities: ₹5,000\nRisk Level: Moderate • Expected Return: 10-14% annually`,
        chartData: [25, 25, 25, 20, 5]
      }
    },
    'HCL Technologies': {
      technical: {
        title: 'Technical Analysis',
        result: `TECHNICAL ANALYSIS FOR HCL Technologies\n- Overall: BULLISH\n- Current Price: ₹1,234\n- 50-day MA: ₹1,200 (trending up)\n- 200-day MA: ₹1,150 (strong uptrend)\n- RSI(14): 61 (bullish)\n- Breakout: Recent resistance break\n- Support: ₹1,180 | Resistance: ₹1,300\nRecommendation: BUY on dips, target ₹1,350.`,
        chartData: [1150, 1180, 1200, 1220, 1234, 1250, 1270, 1290, 1310, 1330]
      },
      prediction: {
        title: 'Trend Prediction',
        result: `TREND PREDICTION FOR HCL Technologies\n- 7-day forecast: Uptrend continues\n- Expected move: +3% to +6%\n- Confidence: 74%\n- Key drivers: Services business, engineering R&D\n- Competitive advantage: Product engineering\nStrategy: Accumulate, strong medium-term outlook.`,
        chartData: [1234, 1250, 1265, 1280, 1295, 1310, 1325]
      },
      sentiment: {
        title: 'Market Sentiment',
        result: `SENTIMENT ANALYSIS FOR HCL Technologies\n- Social sentiment: Positive (76%)\n- News flow: Consistent deal wins\n- Analyst coverage: 75% BUY ratings\n- Differentiated strategy: Mode 1-2-3\n- Client satisfaction: High\nOverall: Positive sentiment with strong execution track record.`,
        chartData: [4, 4, 4, 5, 4, 5, 4]
      },
      fundamental: {
        title: 'Fundamental Analysis',
        result: `FUNDAMENTAL ANALYSIS FOR HCL Technologies\n- P/E Ratio: 19.8 (reasonable)\n- EPS (TTM): ₹62.3\n- Revenue Growth: 16% YoY\n- Operating Margin: 19.1%\n- ROE: 22.4%\n- Cash Position: Strong\nConclusion: Solid fundamentals with consistent growth delivery.`,
        chartData: [14, 16, 18, 19, 20, 19, 19]
      },
      diversification: {
        title: 'Portfolio Allocation',
        result: `DIVERSIFICATION PLAN with HCL Tech (₹100,000)\n- IT Services (HCL focus): ₹30,000\n- Other Technology: ₹25,000\n- Banking/Finance: ₹20,000\n- Healthcare/Pharma: ₹15,000\n- International/Gold: ₹10,000\nRisk Level: Moderate • Expected Return: 13-17% annually`,
        chartData: [30, 25, 20, 15, 10]
      }
    },
    'Axis Bank': {
      technical: {
        title: 'Technical Analysis',
        result: `TECHNICAL ANALYSIS FOR Axis Bank\n- Overall: BULLISH\n- Current Price: ₹1,089\n- 50-day MA: ₹1,040 (strong momentum)\n- 200-day MA: ₹980 (uptrend)\n- RSI(14): 66 (bullish)\n- Volume surge: Recent breakout\n- Support: ₹1,020 | Resistance: ₹1,150\nRecommendation: BUY, target ₹1,200.`,
        chartData: [980, 1020, 1040, 1065, 1089, 1110, 1130, 1150, 1170, 1190]
      },
      prediction: {
        title: 'Trend Prediction',
        result: `TREND PREDICTION FOR Axis Bank\n- 7-day forecast: Strong uptrend\n- Expected move: +4% to +7%\n- Confidence: 77%\n- Key drivers: Digital transformation, retail focus\n- Asset quality: Improving trend\nStrategy: Strong BUY, add on any weakness.`,
        chartData: [1089, 1110, 1125, 1145, 1160, 1175, 1195]
      },
      sentiment: {
        title: 'Market Sentiment',
        result: `SENTIMENT ANALYSIS FOR Axis Bank\n- Social sentiment: Very positive (81%)\n- News flow: Strong quarterly performance\n- Analyst coverage: 85% BUY/STRONG BUY\n- Management execution: Impressive\n- Turnaround story: Well recognized\nOverall: Very strong sentiment with successful transformation.`,
        chartData: [4, 5, 4, 5, 5, 5, 5]
      },
      fundamental: {
        title: 'Fundamental Analysis',
        result: `FUNDAMENTAL ANALYSIS FOR Axis Bank\n- P/E Ratio: 12.8 (attractive)\n- P/B Ratio: 1.8\n- ROA: 1.9%\n- ROE: 15.6%\n- Credit Growth: 18%\n- NPA Ratio: 1.8% (improving)\nConclusion: Strong turnaround story with improving metrics.`,
        chartData: [12, 13, 14, 15, 16, 15, 16]
      },
      diversification: {
        title: 'Portfolio Allocation',
        result: `DIVERSIFICATION PLAN with Axis Bank (₹100,000)\n- Private Banks (Axis focus): ₹35,000\n- IT/Technology: ₹25,000\n- Consumer Discretionary: ₹20,000\n- Debt/Government: ₹15,000\n- Commodities/REITs: ₹5,000\nRisk Level: Moderate-High • Expected Return: 15-19% annually`,
        chartData: [35, 25, 20, 15, 5]
      }
    },
    'Maruti Suzuki': {
      technical: {
        title: 'Technical Analysis',
        result: `TECHNICAL ANALYSIS FOR Maruti Suzuki\n- Overall: NEUTRAL-BULLISH\n- Current Price: ₹10,456\n- 50-day MA: ₹10,200 (trending up)\n- 200-day MA: ₹9,800 (uptrend)\n- RSI(14): 59 (neutral-bullish)\n- Seasonal factor: Festive demand\n- Support: ₹10,000 | Resistance: ₹11,000\nRecommendation: Hold, buy on dips to ₹10,200.`,
        chartData: [9800, 10000, 10200, 10350, 10456, 10600, 10750, 10900, 11050, 11200]
      },
      prediction: {
        title: 'Trend Prediction',
        result: `TREND PREDICTION FOR Maruti Suzuki\n- 7-day forecast: Gradual uptrend\n- Expected move: +2% to +5%\n- Confidence: 69%\n- Key drivers: Festive season, new launches\n- Challenges: Input cost inflation\nStrategy: Accumulate for festive season play.`,
        chartData: [10456, 10520, 10580, 10640, 10700, 10760, 10820]
      },
      sentiment: {
        title: 'Market Sentiment',
        result: `SENTIMENT ANALYSIS FOR Maruti Suzuki\n- Social sentiment: Positive (72%)\n- News flow: New model launches positive\n- Analyst coverage: 70% BUY ratings\n- Rural demand: Showing signs of recovery\n- Market leadership: Maintained\nOverall: Positive sentiment with cyclical recovery expectations.`,
        chartData: [3, 4, 4, 4, 4, 5, 4]
      },
      fundamental: {
        title: 'Fundamental Analysis',
        result: `FUNDAMENTAL ANALYSIS FOR Maruti Suzuki\n- P/E Ratio: 27.2 (premium but justified)\n- EPS (TTM): ₹384.1\n- Revenue Growth: 22% YoY\n- Operating Margin: 11.8%\n- ROE: 18.9%\n- Market Share: 43%\nConclusion: Premium valuation supported by market leadership.`,
        chartData: [18, 20, 22, 25, 27, 26, 27]
      },
      diversification: {
        title: 'Portfolio Allocation',
        result: `DIVERSIFICATION PLAN with Maruti (₹100,000)\n- Auto Sector (Maruti focus): ₹30,000\n- Banking/Finance: ₹25,000\n- IT/Technology: ₹20,000\n- FMCG/Consumer: ₹15,000\n- Debt/Gold: ₹10,000\nRisk Level: Moderate • Expected Return: 12-16% annually`,
        chartData: [30, 25, 20, 15, 10]
      }
    }
  };

  // Toggle card collapsed state
  const toggleCard = (type) => {
    setCollapsedCards(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const aliasToPreset = (name) => {
    const n = (name || '').toLowerCase().trim();
    const map = {
      'tcs': 'TCS',
      'tata consultancy services': 'TCS',
      'reliance': 'Reliance Industries',
      'reliance industries': 'Reliance Industries',
      'adani green': 'Adani Green',
      'adani green energy': 'Adani Green',
      'infosys': 'Infosys',
      'hdfc bank': 'HDFC Bank',
      'hdfcbank': 'HDFC Bank',
      'icici bank': 'ICICI Bank',
      'icicibank': 'ICICI Bank',
      'wipro': 'Wipro',
      'hcl': 'HCL Technologies',
      'hcl technologies': 'HCL Technologies',
      'axis bank': 'Axis Bank',
      'axisbank': 'Axis Bank',
      'maruti suzuki': 'Maruti Suzuki',
      'maruti': 'Maruti Suzuki'
    };
    if (map[n]) return map[n];
    // Fuzzy match against demo keys
    const keys = Object.keys(demoPresets);
    const found = keys.find(k => k.toLowerCase() === n || k.toLowerCase().includes(n) || n.includes(k.toLowerCase()));
    return found || name;
  };

  const handleAnalysis = async (nameOverride) => {
    const inputName = String(nameOverride ?? stockSymbol).trim();
    if (!inputName) {
      setError('Please enter a stock name');
      return;
    }

    setIsLoading(true);
    setError('');
    // Keep previous results until new results are ready to avoid flicker

    try {
      // Use only hardcoded demo presets
      const presetKeyImmediate = aliasToPreset(inputName);
      if (demoPresets[presetKeyImmediate]) {
        setAndPersistAnalysis({
          stock: presetKeyImmediate,
          comprehensive: true,
          analyses: sanitizeDemoAnalyses(demoPresets[presetKeyImmediate])
        });
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        setIsLoading(false);
        return;
      }
      // Not a demo stock
      setError('Demo available for: Reliance Industries, TCS, Infosys, HDFC Bank, ICICI Bank, Adani Green, Wipro, HCL Technologies, Axis Bank, Maruti Suzuki');
      setIsLoading(false);
      return;

      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      
    } catch (error) {
      console.error('Analysis error:', error);
      setError('An error occurred during analysis. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  // (Removed sparkline preview for a cleaner layout)

  const copyResult = async () => {
    try {
      let textToCopy = '';
      
      if (analysisData?.comprehensive) {
        // Copy all analysis results for comprehensive view
        textToCopy = `COMPREHENSIVE ANALYSIS FOR ${analysisData.stock}\n\n`;
        Object.entries(analysisData.analyses).forEach(([type, analysis]) => {
          textToCopy += `${analysis.title.toUpperCase()}\n`;
          textToCopy += `${analysis.result}\n\n`;
        });
      } else {
        // Copy single analysis result
        textToCopy = analysisData?.result || '';
      }
      
      await navigator.clipboard.writeText(textToCopy);
    } catch (e) {
      console.warn('copy failed', e);
    }
  };

  const handleStockSelect = (stock) => {
    setStockSymbol(stock);
  };

  const formatAnalysisResult = (result) => {
    // Split by lines and format nicely
    const lines = result.split('\n').filter(line => line.trim());
    return lines.map((line, index) => {
      if (line.includes(':') && (line.includes('PREDICTION') || line.includes('CONFIDENCE') || line.includes('OVERALL') || line.includes('INDICATORS') || line.includes('SIGNALS'))) {
        return (
          <div key={index} className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-2">
            {line}
          </div>
        );
      } else if (line.startsWith('- ') || line.startsWith('• ')) {
        const content = line.substring(2);
        let colorClass = 'text-gray-600 dark:text-gray-400';
        
        if (content.includes('BULLISH') || content.includes('BUY') || content.includes('STRONG UP') || content.includes('(+)')) {
          colorClass = 'text-green-600 dark:text-green-400';
        } else if (content.includes('BEARISH') || content.includes('SELL') || content.includes('DOWN') || content.includes('(-)')) {
          colorClass = 'text-red-600 dark:text-red-400';
        } else if (content.includes('NEUTRAL') || content.includes('SIDEWAYS')) {
          colorClass = 'text-yellow-600 dark:text-yellow-400';
        }
        
        return (
          <div key={index} className={`text-sm ${colorClass} ml-4 mb-1`}>
            • {content}
          </div>
        );
      } else if (line.includes('₹') || line.includes('%')) {
        return (
          <div key={index} className="text-sm text-blue-600 dark:text-blue-400 ml-2 mb-1 font-mono">
            {line}
          </div>
        );
      }
      return (
        <div key={index} className="text-sm text-gray-700 dark:text-gray-300 mb-1">
          {line}
        </div>
      );
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <PageHeader 
        title="AI-Powered Stock Analyzer"
        subtitle="Quick, readable analysis: technical signals, short-term trend forecasts, sentiment and valuation."
        icon={LineChart}
      />

      {/* Stock Input Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Stock Input */}
          <div className="mb-6">
            <div className="text-center mb-4">
              <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter Stock Name
              </label>
            </div>
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={stockSymbol}
                onChange={(e) => setStockSymbol(e.target.value)}
                placeholder="Enter stock name (e.g., Reliance Industries, TCS, Infosys)"
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
                onKeyPress={(e) => e.key === 'Enter' && handleAnalysis()}
              />
            </div>
          </div>
          
          {/* Popular Stocks */}
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Quick select popular stocks:</p>
            <div className="flex flex-wrap gap-3 justify-center max-w-4xl mx-auto">
              {popularStocks.map((stock) => (
                <button
                  key={stock}
                  onClick={() => handleStockSelect(stock)}
                  className="px-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all border border-gray-200 dark:border-gray-600"
                >
                  {stock}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Analyze Button - Centered and Prominent */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => handleAnalysis()}
            disabled={isLoading || !stockSymbol.trim()}
            className={`px-12 py-4 rounded-xl font-medium transition-all ${
              isLoading || !stockSymbol.trim()
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Analyzing all categories...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Get Comprehensive Analysis</span>
              </div>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {analysisData && (
        <motion.div
          ref={resultsRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analysisData.comprehensive ? 'Comprehensive Analysis' : 'Analysis Results'} for {analysisData.stock}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {analysisData.comprehensive 
                    ? 'Complete analysis across all categories' 
                    : `${analysisTypes.find(t => t.id === analysisData.type)?.label} Report`
                  }
                </p>
              </div>
              <button onClick={copyResult} className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1">
                <Copy className="h-4 w-4" /> <span>Copy All</span>
              </button>
            </div>
          </div>

          {/* Analysis Cards */}
          {analysisData.comprehensive ? (
            // Comprehensive view - two cards per row
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(analysisData.analyses)
                .filter(([type]) => type !== 'diversification')
                .map(([type, analysis]) => {
                const analysisType = analysisTypes.find(t => t.id === type);
                const Icon = analysisType?.icon || BarChart3;
                
                return (
                  <motion.div
                    key={type}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Object.keys(analysisData.analyses).indexOf(type) * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
                  >
                    {/* Card Header - Cleaner design with collapse toggle */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{analysis.title}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{analysisType?.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          {/* Chart preview - compact version */}
                          {/* sparkline removed */}
                          
                          {/* Collapse toggle button */}
                          <button
                            onClick={() => toggleCard(type)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            {collapsedCards[type] ? (
                              <ChevronDown className="h-5 w-5 text-gray-500" />
                            ) : (
                              <ChevronUp className="h-5 w-5 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Card Content - Collapsible */}
                    {!collapsedCards[type] && (
                      <div className="p-6">
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            {formatAnalysisResult(analysis.result)}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            // Single analysis view (original layout)
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-auto">
                      {formatAnalysisResult(analysisData.result)}
                    </div>
                  </div>

                  <div className="lg:col-span-1 space-y-4">
                    {analysisData.demoChart && Array.isArray(analysisData.demoChart) && (
                      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Preview Chart</div>
                          <div className="text-xs text-gray-500">{analysisData.type}</div>
                        </div>
                        <Sparkline data={analysisData.demoChart} />
                      </div>
                    )}

                    {analysisData.type === 'diversification' && analysisData.demoChart && (
                      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Allocation (₹)</div>
                        <div className="flex flex-wrap gap-2">
                          {['Equity','Direct Equity','Debt','Gold','Cash'].map((label,i) => (
                            <div key={label} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{label}: {analysisData.demoChart[i]}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          
        </motion.div>
      )}
    </div>
  );
};

export default StockAnalyzer;
