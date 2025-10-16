import { useState, useEffect } from 'react';
import { TrendingUp, Calculator, PiggyBank, CreditCard, Target, BarChart3, DollarSign, Percent, Calendar, Copy, Zap } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const format = (v) => {
  if (v === undefined || v === null || Number.isNaN(Number(v))) return '-';
  return Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const formatCompact = (v) => {
  if (v === undefined || v === null || Number.isNaN(Number(v))) return '-';
  const num = Number(v);
  if (num >= 10000000) return (num / 10000000).toFixed(1) + 'Cr';
  if (num >= 100000) return (num / 100000).toFixed(1) + 'L';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

// Safely format a number to 1 decimal place without throwing on undefined/NaN
const fixed1 = (v) => {
  const num = Number(v);
  return Number.isFinite(num) ? num.toFixed(1) : '0.0';
};

const MoneyCalc = () => {
  const [mode, setMode] = useState('lumpsum'); // lumpsum | sip | emi | ppf | goal

  // common
  const [rate, setRate] = useState('12');

  // lumpsum
  const [principal, setPrincipal] = useState('100000');
  const [years, setYears] = useState('5');

  // sip
  const [monthly, setMonthly] = useState('5000');
  const [sipYears, setSipYears] = useState('10');

  // emi
  const [loanAmount, setLoanAmount] = useState('500000');
  const [tenureMonths, setTenureMonths] = useState('60');

  // ppf
  const [ppfAmount, setPpfAmount] = useState('150000');
  const [ppfYears, setPpfYears] = useState('15');

  // goal planning
  const [targetAmount, setTargetAmount] = useState('1000000');
  const [goalYears, setGoalYears] = useState('10');

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const calculationModes = [
    { id: 'lumpsum', label: 'Lump Sum', icon: DollarSign, desc: 'One-time investment growth', color: 'indigo' },
    { id: 'sip', label: 'SIP', icon: TrendingUp, desc: 'Systematic Investment Plan', color: 'green' },
    { id: 'emi', label: 'EMI', icon: CreditCard, desc: 'Loan EMI calculator', color: 'red' },
    { id: 'ppf', label: 'PPF', icon: PiggyBank, desc: 'Public Provident Fund', color: 'blue' },
    { id: 'goal', label: 'Goal', icon: Target, desc: 'Goal-based planning', color: 'purple' }
  ];

  const presetAmounts = {
    lumpsum: [50000, 100000, 500000, 1000000],
    sip: [1000, 5000, 10000, 25000],
    emi: [200000, 500000, 1000000, 2500000],
    ppf: [50000, 100000, 150000],
    goal: [500000, 1000000, 5000000, 10000000]
  };

  const calcLump = () => {
    const P = parseFloat(principal) || 0;
    const r = (parseFloat(rate) || 0) / 100;
    const n = parseFloat(years) || 0;
    const fv = P * Math.pow(1 + r, n);
    const gain = fv - P;
    const gainPercent = P > 0 ? ((gain / P) * 100) : 0;
    return { fv, gain, gainPercent, invested: P };
  };

  const calcSIP = () => {
    const PMT = parseFloat(monthly) || 0;
    const r = (parseFloat(rate) || 0) / 100 / 12;
    const n = (parseFloat(sipYears) || 0) * 12;
    if (n === 0) return { fv: 0, invested: 0, gain: 0, gainPercent: 0 };
    // Handle zero rate to avoid division by zero
    const fv = r === 0
      ? PMT * n
      : PMT * ( (Math.pow(1+r, n) - 1) / r ) * (1 + r);
    const invested = PMT * n;
    const gain = fv - invested;
    const gainPercent = invested > 0 ? ((gain / invested) * 100) : 0;
    return { fv, invested, gain, gainPercent };
  };

  const calcEMI = () => {
    const P = parseFloat(loanAmount) || 0;
    const r = (parseFloat(rate) || 0) / 100 / 12;
    const n = parseFloat(tenureMonths) || 0;
    if (n === 0) return { emi: 0, total: 0, interest: 0, interestPercent: 0 };
    if (r === 0) {
      const emi = P / n;
      return { emi, total: emi * n, interest: 0, interestPercent: 0 };
    }
    const emi = (P * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1);
    const total = emi * n;
    const interest = total - P;
    const interestPercent = P > 0 ? ((interest / P) * 100) : 0;
    return { emi, total, interest, interestPercent };
  };

  const calcPPF = () => {
    const A = parseFloat(ppfAmount) || 0;
    const n = parseFloat(ppfYears) || 0;
    const r = 0.076; // Current PPF rate ~7.6%
    const fv = A * ( (Math.pow(1+r, n) - 1) / r );
    const invested = A * n;
    const gain = fv - invested;
    const gainPercent = invested > 0 ? ((gain / invested) * 100) : 0;
    return { fv, invested, gain, gainPercent };
  };

  const calcGoal = () => {
    const target = parseFloat(targetAmount) || 0;
    const n = parseFloat(goalYears) || 0;
    const r = (parseFloat(rate) || 0) / 100 / 12;
    const months = n * 12;
    
    if (months === 0) return { sipRequired: 0, lumpRequired: 0 };
    
    // SIP required to reach goal (handle zero rate)
    const sipRequired = r === 0
      ? target / months
      : (target * r) / ((Math.pow(1+r, months) - 1) * (1 + r));
    
    // Lump sum required today (handle zero annual rate)
    const annualRate = (parseFloat(rate) || 0) / 100;
    const lumpRequired = annualRate === 0
      ? target
      : target / Math.pow(1 + annualRate, n);
    
    return { sipRequired, lumpRequired, target, years: n };
  };

  // re-calc whenever inputs change for instant feedback
  useEffect(() => {
    setError('');
    try {
      if (mode === 'lumpsum') setResult(calcLump());
      if (mode === 'sip') setResult(calcSIP());
      if (mode === 'emi') setResult(calcEMI());
      if (mode === 'ppf') setResult(calcPPF());
      if (mode === 'goal') setResult(calcGoal());
    } catch (e) {
      setError('Invalid input');
    }
  }, [mode, rate, principal, years, monthly, sipYears, loanAmount, tenureMonths, ppfAmount, ppfYears, targetAmount, goalYears]);

  const copyResult = () => {
    if (!result) return;
    let text = '';
    
    if (mode === 'lumpsum') {
      text = `Lump Sum Investment:\nPrincipal: ₹${format(principal)}\nRate: ${rate}% for ${years} years\nFuture Value: ₹${format(result.fv)}\nGain: ₹${format(result.gain)} (${result.gainPercent.toFixed(1)}%)`;
    } else if (mode === 'sip') {
      text = `SIP Investment:\nMonthly: ₹${format(monthly)}\nRate: ${rate}% for ${sipYears} years\nFuture Value: ₹${format(result.fv)}\nInvested: ₹${format(result.invested)}\nGain: ₹${format(result.gain)} (${fixed1(result.gainPercent)}%)`;
    } else if (mode === 'emi') {
      text = `Loan EMI:\nLoan Amount: ₹${format(loanAmount)}\nRate: ${rate}% for ${tenureMonths} months\nEMI: ₹${format(result.emi)}\nTotal Payable: ₹${format(result.total)}\nInterest: ₹${format(result.interest)} (${fixed1(result.interestPercent)}%)`;
    } else if (mode === 'ppf') {
      text = `PPF Investment:\nAnnual: ₹${format(ppfAmount)}\nFor ${ppfYears} years\nMaturity Value: ₹${format(result.fv)}\nInvested: ₹${format(result.invested)}\nGain: ₹${format(result.gain)} (${fixed1(result.gainPercent)}%)`;
    } else if (mode === 'goal') {
      text = `Goal Planning:\nTarget: ₹${format(targetAmount)} in ${goalYears} years\nSIP Required: ₹${format(result.sipRequired)}/month\nLump Sum Required: ₹${format(result.lumpRequired)} today`;
    }
    
    navigator.clipboard.writeText(text);
  };

  const setPresetAmount = (amount) => {
    if (mode === 'lumpsum') setPrincipal(amount.toString());
    else if (mode === 'sip') setMonthly(amount.toString());
    else if (mode === 'emi') setLoanAmount(amount.toString());
    else if (mode === 'ppf') setPpfAmount(amount.toString());
    else if (mode === 'goal') setTargetAmount(amount.toString());
  };

  const currentMode = calculationModes.find(m => m.id === mode);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <PageHeader 
        title="Advanced Money Calculator"
        subtitle="Comprehensive financial planning tools with instant calculations"
        icon={Calculator}
      />

      {/* Mode Selection */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {calculationModes.map((calcMode) => {
            const Icon = calcMode.icon;
            const isActive = mode === calcMode.id;
            return (
              <button
                key={calcMode.id}
                onClick={() => setMode(calcMode.id)}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  isActive 
                    ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className={`h-6 w-6 mx-auto mb-2 ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'
                }`} />
                <div className={`font-medium text-sm ${
                  isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {calcMode.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {calcMode.desc}
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  {currentMode && <currentMode.icon className="h-6 w-6 text-indigo-600" />}
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {currentMode?.label} Calculator
                  </h2>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Zap className="h-4 w-4" />
                  <span>Live calculation</span>
                </div>
              </div>

              {/* Input Fields */}
              <div className="space-y-6">
                {/* Common Rate Field */}
                {mode !== 'ppf' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Percent className="inline h-4 w-4 mr-1" />
                      Annual Interest Rate (%)
                    </label>
                    <input 
                      type="number"
                      value={rate} 
                      onChange={e => setRate(e.target.value)} 
                      className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter interest rate"
                    />
                  </div>
                )}

                {/* Mode-specific fields */}
                {mode === 'lumpsum' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <DollarSign className="inline h-4 w-4 mr-1" />
                        Principal Amount (₹)
                      </label>
                      <input 
                        type="number"
                        value={principal} 
                        onChange={e => setPrincipal(e.target.value)} 
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter principal amount"
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {presetAmounts.lumpsum.map(amount => (
                          <button
                            key={amount}
                            onClick={() => setPresetAmount(amount)}
                            className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            ₹{formatCompact(amount)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Investment Period (Years)
                      </label>
                      <input 
                        type="number"
                        value={years} 
                        onChange={e => setYears(e.target.value)} 
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter number of years"
                      />
                    </div>
                  </>
                )}

                {mode === 'sip' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <TrendingUp className="inline h-4 w-4 mr-1" />
                        Monthly SIP Amount (₹)
                      </label>
                      <input 
                        type="number"
                        value={monthly} 
                        onChange={e => setMonthly(e.target.value)} 
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter monthly SIP amount"
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {presetAmounts.sip.map(amount => (
                          <button
                            key={amount}
                            onClick={() => setPresetAmount(amount)}
                            className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                          >
                            ₹{formatCompact(amount)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Investment Period (Years)
                      </label>
                      <input 
                        type="number"
                        value={sipYears} 
                        onChange={e => setSipYears(e.target.value)} 
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter number of years"
                      />
                    </div>
                  </>
                )}

                {mode === 'emi' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <CreditCard className="inline h-4 w-4 mr-1" />
                        Loan Amount (₹)
                      </label>
                      <input 
                        type="number"
                        value={loanAmount} 
                        onChange={e => setLoanAmount(e.target.value)} 
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter loan amount"
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {presetAmounts.emi.map(amount => (
                          <button
                            key={amount}
                            onClick={() => setPresetAmount(amount)}
                            className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          >
                            ₹{formatCompact(amount)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Loan Tenure (Months)
                      </label>
                      <input 
                        type="number"
                        value={tenureMonths} 
                        onChange={e => setTenureMonths(e.target.value)} 
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter tenure in months"
                      />
                    </div>
                  </>
                )}

                {mode === 'ppf' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <PiggyBank className="inline h-4 w-4 mr-1" />
                        Annual PPF Contribution (₹)
                      </label>
                      <input 
                        type="number"
                        value={ppfAmount} 
                        onChange={e => setPpfAmount(e.target.value)} 
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter annual contribution (max ₹1.5L)"
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {presetAmounts.ppf.map(amount => (
                          <button
                            key={amount}
                            onClick={() => setPresetAmount(amount)}
                            className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            ₹{formatCompact(amount)}
                          </button>
                        ))}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        Current PPF rate: 7.6% (Fixed by government)
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Investment Period (Years)
                      </label>
                      <input 
                        type="number"
                        value={ppfYears} 
                        onChange={e => setPpfYears(e.target.value)} 
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter number of years (min 15)"
                      />
                    </div>
                  </>
                )}

                {mode === 'goal' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Target className="inline h-4 w-4 mr-1" />
                        Target Amount (₹)
                      </label>
                      <input 
                        type="number"
                        value={targetAmount} 
                        onChange={e => setTargetAmount(e.target.value)} 
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter your financial goal"
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {presetAmounts.goal.map(amount => (
                          <button
                            key={amount}
                            onClick={() => setPresetAmount(amount)}
                            className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                          >
                            ₹{formatCompact(amount)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Time to Goal (Years)
                      </label>
                      <input 
                        type="number"
                        value={goalYears} 
                        onChange={e => setGoalYears(e.target.value)} 
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Enter number of years"
                      />
                    </div>
                  </>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-1">
            {result && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Results</h3>
                  <button 
                    onClick={copyResult}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                {mode === 'lumpsum' && (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                      <div className="text-sm text-indigo-600 dark:text-indigo-400 mb-1">Future Value</div>
                      <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">₹{format(result.fv)}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Invested</div>
                        <div className="font-semibold text-gray-900 dark:text-white">₹{format(result.invested)}</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-xs text-green-600 dark:text-green-400">Gain</div>
                        <div className="font-semibold text-green-700 dark:text-green-300">₹{format(result.gain)}</div>
                      </div>
                    </div>
                    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                      Total return: {fixed1(result.gainPercent)}% over {years} years
                    </div>
                  </div>
                )}

                {mode === 'sip' && (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-sm text-green-600 dark:text-green-400 mb-1">SIP Future Value</div>
                      <div className="text-2xl font-bold text-green-900 dark:text-green-100">₹{format(result.fv)}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Invested</div>
                        <div className="font-semibold text-gray-900 dark:text-white">₹{format(result.invested)}</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-xs text-green-600 dark:text-green-400">Gain</div>
                        <div className="font-semibold text-green-700 dark:text-green-300">₹{format(result.gain)}</div>
                      </div>
                    </div>
                    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                      Total return: {fixed1(result.gainPercent)}% over {sipYears} years
                    </div>
                  </div>
                )}

                {mode === 'emi' && (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-sm text-red-600 dark:text-red-400 mb-1">Monthly EMI</div>
                      <div className="text-2xl font-bold text-red-900 dark:text-red-100">₹{format(result.emi)}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Principal</div>
                        <div className="font-semibold text-gray-900 dark:text-white">₹{format(loanAmount)}</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="text-xs text-red-600 dark:text-red-400">Interest</div>
                        <div className="font-semibold text-red-700 dark:text-red-300">₹{format(result.interest)}</div>
                      </div>
                    </div>
                    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                      Total payable: ₹{format(result.total)} ({fixed1(result.interestPercent)}% interest)
                    </div>
                  </div>
                )}

                {mode === 'ppf' && (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">PPF Maturity Value</div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">₹{format(result.fv)}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Invested</div>
                        <div className="font-semibold text-gray-900 dark:text-white">₹{format(result.invested)}</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-xs text-blue-600 dark:text-blue-400">Gain</div>
                        <div className="font-semibold text-blue-700 dark:text-blue-300">₹{format(result.gain)}</div>
                      </div>
                    </div>
                    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                      Total return: {fixed1(result.gainPercent)}% over {ppfYears} years (Tax-free!)
                    </div>
                  </div>
                )}

                {mode === 'goal' && (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Target Goal</div>
                      <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">₹{format(result.target)}</div>
                    </div>
                    <div className="space-y-3">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Monthly SIP Required</div>
                        <div className="font-semibold text-gray-900 dark:text-white">₹{format(result.sipRequired)}</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Lump Sum Required Today</div>
                        <div className="font-semibold text-gray-900 dark:text-white">₹{format(result.lumpRequired)}</div>
                      </div>
                    </div>
                    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                      To reach your goal in {goalYears} years at {rate}% return
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default MoneyCalc;
