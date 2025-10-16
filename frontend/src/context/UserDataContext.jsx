import { createContext, useContext, useState, useEffect } from 'react';

const UserDataContext = createContext();

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};

export const UserDataProvider = ({ children }) => {
  // State for all user financial data (in-memory only)
  const [userData, setUserData] = useState({
    assets: [],
    liabilities: [],
    incomes: [],
    expenses: [],
    goals: [],
    riskTolerance: {
      score: 0,
      timeHorizon: 'medium',
      riskCapacity: 'moderate'
    }
  });

  // Fetch portfolio from backend using the signed-in user's email (from localStorage identity only)
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const rawUser = localStorage.getItem('userData');
        const currentUser = rawUser ? JSON.parse(rawUser) : null;
        const currentEmail = currentUser?.email;
        if (!currentEmail) {
          setUserData(prev => ({ ...prev, assets: [], liabilities: [], incomes: [], expenses: [], goals: [] }));
          return;
        }
        const res = await fetch(`http://127.0.0.1:5000/user-portfolio?email=${encodeURIComponent(currentEmail)}`);
        const payload = await res.json();

        // Map backend payload to frontend shapes
        const deriveCategory = (asset) => {
          const t = (asset.type || '').toLowerCase();
          const n = (asset.name || '').toLowerCase();
          if (t.includes('mutual') || n.includes('fund')) return 'investments';
          if (t.includes('stock') || t.includes('equity')) return 'investments';
          if (t.includes('ppf') || t.includes('fd') || n.includes('ppf')) return 'bank';
          if (t.includes('gold') || n.includes('gold')) return 'other';
          if (t.includes('real') || n.includes('apartment') || n.includes('property')) return 'realestate';
          return asset.category || 'investments';
        };

        const mappedAssets = (payload.assets || []).map((a, idx) => ({
          id: `asset-${idx}`,
          name: a.name,
          category: deriveCategory(a),
          value: Number(a.current_value || 0),
          quantity: a.quantity || 0,
        }));

        const mapLiabilityCategory = (liab) => {
          const t = (liab.type || '').toLowerCase();
          if (t.includes('mortgage') || t.includes('home')) return 'mortgage';
          if (t.includes('auto') || t.includes('car') || t.includes('vehicle')) return 'vehicle';
          if (t.includes('credit')) return 'credit';
          if (t.includes('personal')) return 'personal';
          if (t.includes('business')) return 'business';
          return 'other';
        };

        const mappedLiabilities = (payload.liabilities || []).map((l, idx) => ({
          id: `liability-${idx}`,
          name: l.name,
          amount: Number(l.current_balance || 0),
          paid: 0,
          interestRate: Number(l.interest_rate || 0),
          category: mapLiabilityCategory(l),
          monthlyPayment: Number(l.monthly_payment ?? (l.current_balance ? (Number(l.current_balance)/60) : 0)) || 0,
          startDate: l.start_date || '',
          endDate: l.maturity_date || '',
          isSecured: ['mortgage','vehicle','business'].includes(mapLiabilityCategory(l)),
        }));

        const mappedIncomes = (payload.income || []).map((i, idx) => ({
          id: `income-${idx}`,
          source: i.source_name || 'Income',
          amount: Number(i.amount || 0),
          frequency: i.frequency || 'monthly',
          category: i.income_type || 'salary',
          date: '2024-01-01',
        }));

        const normalizeCategory = (name) => {
          const n = (name || '').toLowerCase();
          if (n.includes('housing') || n.includes('rent')) return 'housing';
          if (n.includes('food')) return 'food';
          if (n.includes('transport')) return 'transport';
          if (n.includes('utilit')) return 'utilities';
          if (n.includes('entertain')) return 'entertainment';
          if (n.includes('insur')) return 'insurance';
          if (n.includes('personal')) return 'personal';
          if (n.includes('invest')) return 'investment';
          if (n.includes('shop')) return 'shopping';
          if (n.includes('travel')) return 'travel';
          return 'other';
        };

        const mappedExpenses = (payload.expenses || []).map((e, idx) => {
          const category = normalizeCategory(e.category);
          const isEssentialDefault = ['housing','food','utilities','insurance','transport'].includes(category);
          return {
            id: `expense-${idx}`,
            name: e.name || e.title || e.category || 'Expense',
            description: e.description || e.category || 'Expense',
            amount: Number(e.amount || 0),
            frequency: e.frequency || 'monthly',
            category,
            isEssential: e.is_essential ?? isEssentialDefault,
            date: e.date || '2024-01-01',
          };
        });

        const mappedGoals = (payload.goals || []).map((g, idx) => ({
          id: `goal-${idx}`,
          name: g.title || 'Goal',
          targetAmount: Number(g.target_amount || 0),
          currentAmount: Number(g.current_amount || 0),
          deadline: g.target_date || '2030-12-31',
          priority: g.priority || 'medium',
        }));

        const risk = payload.risk_profile || {};
        const mappedRisk = {
          score: Number(risk.risk_score || 0),
          timeHorizon: risk.time_horizon || 'medium',
          riskCapacity: risk.risk_capacity || 'moderate',
        };

        setUserData({
          assets: mappedAssets,
          liabilities: mappedLiabilities,
          incomes: mappedIncomes,
          expenses: mappedExpenses,
          goals: mappedGoals,
          riskTolerance: mappedRisk,
        });
      } catch (error) {
        console.error('Error fetching portfolio:', error);
        setUserData(prev => ({ ...prev, assets: [], liabilities: [], incomes: [], expenses: [], goals: [] }));
      }
    };

    fetchPortfolio();

    // Refresh when login updates the user identity
    const handleUserDataUpdated = () => fetchPortfolio();
    window.addEventListener('user-data-updated', handleUserDataUpdated);
    return () => window.removeEventListener('user-data-updated', handleUserDataUpdated);
  }, []);

  // Calculate derived portfolio data from user inputs
  const getPortfolioSummary = () => {
    console.log('getPortfolioSummary: Current userData:', userData);
    console.log('getPortfolioSummary: Assets structure:', userData.assets);
    
    try {
      const totalAssets = userData.assets.reduce((sum, asset) => {
        console.log('Processing asset:', asset, 'Value:', asset.value);
        return sum + (asset.value || 0);
      }, 0);
      
      const totalLiabilities = userData.liabilities.reduce((sum, liability) => sum + (liability.amount - (liability.paid || 0)), 0);
      const netWorth = totalAssets - totalLiabilities;
      
      console.log('getPortfolioSummary: Total assets calculated:', totalAssets);
      
      const monthlyIncome = userData.incomes
        .filter(income => income.frequency === 'monthly')
        .reduce((sum, income) => sum + income.amount, 0);
    
    console.log('getPortfolioSummary: Monthly income calculated:', monthlyIncome, 'from incomes:', userData.incomes);
    
    const monthlyExpenses = userData.expenses
      .filter(expense => expense.frequency === 'monthly')
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    const monthlySavings = monthlyIncome - monthlyExpenses;
    
    // Calculate goal progress (average)
    const goalProgress = userData.goals.length > 0 
      ? userData.goals.reduce((sum, goal) => {
          const progress = (goal.currentAmount || 0) / goal.targetAmount * 100;
          return sum + Math.min(progress, 100);
        }, 0) / userData.goals.length
      : 0;

    return {
      totalValue: netWorth,
      totalAssets,
      totalLiabilities,
      monthlyIncome,
      monthlyExpenses,
      monthlyReturns: monthlySavings,
      monthlySavings,
      goalProgress: parseFloat(goalProgress.toFixed(1)),
      monthlyChange: monthlySavings > 0 ? 8.5 : -2.3, // Mock calculation
      returnsChange: 12.4 // Mock calculation
    };
    
    } catch (error) {
      console.error('Error in getPortfolioSummary:', error);
      return {
        totalValue: 0,
        totalAssets: 0,
        totalLiabilities: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthlyReturns: 0,
        monthlySavings: 0,
        goalProgress: 0,
        monthlyChange: 0,
        returnsChange: 0
      };
    }
  };

  // Get asset allocation for portfolio charts
  const getAssetAllocation = () => {
    try {
      console.log('getAssetAllocation: Starting calculation with assets:', userData.assets);
      const totalAssets = userData.assets.reduce((sum, asset) => sum + (asset.value || 0), 0);
      console.log('getAssetAllocation: Total assets value:', totalAssets);
      
      if (totalAssets === 0) {
        console.log('getAssetAllocation: No assets found, returning default allocation');
        // Return default allocation if no assets
        return [
          { name: 'Indian Stocks', value: 45, amount: 0, color: '#4F46E5' },
          { name: 'Indian Bonds', value: 25, amount: 0, color: '#10B981' },
          { name: 'International Markets', value: 15, amount: 0, color: '#F59E0B' },
          { name: 'Real Estate', value: 10, amount: 0, color: '#EF4444' },
          { name: 'Cash & Others', value: 5, amount: 0, color: '#6B7280' }
        ];
      }

      // Map user asset categories to portfolio categories
      const categoryMapping = {
        realestate: 'Real Estate',
        investments: 'Indian Stocks',
        bank: 'Indian Bonds',
        cash: 'Cash & Others',
        vehicles: 'Real Estate',
        other: 'Cash & Others'
      };

      const allocation = {};
      console.log('getAssetAllocation: Processing assets:', userData.assets);
      userData.assets.forEach(asset => {
        if (asset && asset.category && asset.value) {
          const portfolioCategory = categoryMapping[asset.category] || 'Cash & Others';
          allocation[portfolioCategory] = (allocation[portfolioCategory] || 0) + asset.value;
          console.log(`Asset: ${asset.name}, Category: ${asset.category} -> ${portfolioCategory}, Value: ${asset.value}`);
        }
      });
      
      console.log('getAssetAllocation: Final allocation:', allocation);

    // Convert to portfolio format with colors
    const colorMapping = {
      'Indian Stocks': '#4F46E5',
      'Indian Bonds': '#10B981', 
      'International Markets': '#F59E0B',
      'Real Estate': '#EF4444',
      'Cash & Others': '#6B7280'
    };

    return Object.entries(allocation).map(([name, amount]) => ({
      name,
      value: parseFloat(((amount / totalAssets) * 100).toFixed(1)),
      amount,
      color: colorMapping[name] || '#6B7280'
    }));
    
    } catch (error) {
      console.error('Error in getAssetAllocation:', error);
      return [
        { name: 'Indian Stocks', value: 45, amount: 0, color: '#4F46E5' },
        { name: 'Indian Bonds', value: 25, amount: 0, color: '#10B981' },
        { name: 'International Markets', value: 15, amount: 0, color: '#F59E0B' },
        { name: 'Real Estate', value: 10, amount: 0, color: '#EF4444' },
        { name: 'Cash & Others', value: 5, amount: 0, color: '#6B7280' }
      ];
    }
  };

  // Get monthly data for charts
  const getMonthlyData = () => {
    const baseMonthlyIncome = userData.incomes
      .filter(income => income.frequency === 'monthly')
      .reduce((sum, income) => sum + income.amount, 0);
    
    const baseMonthlyExpenses = userData.expenses
      .filter(expense => expense.frequency === 'monthly')
      .reduce((sum, expense) => sum + expense.amount, 0);

    // Generate 6 months of data with some variation
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((name, index) => {
      const variation = 1 + (Math.sin(index) * 0.1); // Add some realistic variation
      const income = Math.round(baseMonthlyIncome * variation);
      const expenses = Math.round(baseMonthlyExpenses * variation);
      return {
        name,
        value: income,
        expenses,
        savings: income - expenses
      };
    });
  };

  // Get investment goals in portfolio format
  const getInvestmentGoals = () => {
    return userData.goals.map(goal => ({
      name: goal.title,
      current: goal.currentAmount || 0,
      target: goal.targetAmount,
      timeline: goal.timeline || 'Long term'
    }));
  };

  // Get liabilities in portfolio format
  const getLiabilities = () => {
    return userData.liabilities.map(liability => ({
      type: liability.name,
      amount: liability.amount,
      paid: liability.paid || 0,
      monthlyPayment: liability.monthlyPayment || (liability.amount / 60), // Default 5 years
      interestRate: liability.interestRate || 8.5,
      isSecured: liability.category === 'secured',
      description: liability.description || `${liability.category} liability`
    }));
  };

  // Update methods for each data type
  const updateAssets = (assets) => {
    setUserData(prev => ({ ...prev, assets: [...assets] }));
    localStorage.setItem('userAssets', JSON.stringify(assets));
  };

  const updateLiabilities = (liabilities) => {
    setUserData(prev => ({ ...prev, liabilities: [...liabilities] }));
    localStorage.setItem('userLiabilities', JSON.stringify(liabilities));
  };

  const updateIncomes = (incomes) => {
    console.log('UserDataContext: Updating incomes:', incomes);
    console.log('UserDataContext: Previous userData:', userData);
    
    // Force a complete state update to trigger re-renders
    setUserData(prev => {
      const newData = { 
        ...prev, 
        incomes: [...incomes] // Create new array reference
      };
      console.log('UserDataContext: New user data after update:', newData);
      return newData;
    });
    
    localStorage.setItem('userIncomes', JSON.stringify(incomes));
    console.log('UserDataContext: Saved to localStorage:', incomes);
    
    // Force a small delay to ensure state propagation
    setTimeout(() => {
      console.log('UserDataContext: State should be updated now');
    }, 100);
  };

  const updateExpenses = (expenses) => {
    setUserData(prev => ({ ...prev, expenses: [...expenses] }));
    localStorage.setItem('userExpenses', JSON.stringify(expenses));
  };

  const updateGoals = (goals) => {
    setUserData(prev => ({ ...prev, goals: [...goals] }));
    localStorage.setItem('userGoals', JSON.stringify(goals));
  };

  const updateRiskTolerance = (riskTolerance) => {
    setUserData(prev => ({ ...prev, riskTolerance: { ...riskTolerance } }));
    localStorage.setItem('userRiskTolerance', JSON.stringify(riskTolerance));
  };

  const value = {
    userData,
    setUserData,
    getPortfolioSummary,
    getAssetAllocation,
    getMonthlyData,
    getInvestmentGoals,
    getLiabilities,
    updateAssets,
    updateLiabilities,
    updateIncomes,
    updateExpenses,
    updateGoals,
    updateRiskTolerance
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};