// Performance data for historical charts
export const performanceData = [
  { month: 'Jan', portfolio: 1000000, benchmark: 980000, risk: 950000 },
  { month: 'Feb', portfolio: 1050000, benchmark: 1000000, risk: 980000 },
  { month: 'Mar', portfolio: 1150000, benchmark: 1100000, risk: 1050000 },
  { month: 'Apr', portfolio: 1200000, benchmark: 1150000, risk: 1100000 },
  { month: 'May', portfolio: 1250000, benchmark: 1200000, risk: 1150000 },
  { month: 'Jun', portfolio: 1300000, benchmark: 1250000, risk: 1200000 }
];

// Recent activity data for portfolio display
export const recentActivity = [
  {
    type: 'Stock Purchase',
    amount: '+ ₹50,000',
    date: '2024-01-25',
    status: 'Completed',
    category: 'HDFC Bank',
    balance: '₹4,50,000'
  },
  {
    type: 'SIP Investment',
    amount: '+ ₹25,000',
    date: '2024-01-20',
    status: 'Completed',
    category: 'Mutual Funds',
    balance: '₹4,00,000'
  }
];

// Risk metrics for portfolio analysis
export const riskMetrics = {
  volatility: 12.5,
  sharpeRatio: 1.8,
  maxDrawdown: -15.2,
  beta: 0.85,
  alpha: 2.3
};

// Market indicators for real-time market data
export const marketIndicators = [
  { name: 'NIFTY 50', value: '22,378.40', trend: 'up' },
  { name: 'SENSEX', value: '73,745.35', trend: 'up' },
  { name: 'BANK NIFTY', value: '46,875.20', trend: 'down' },
  { name: 'NIFTY IT', value: '33,456.80', trend: 'up' }
];
