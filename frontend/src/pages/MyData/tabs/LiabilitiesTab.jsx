import { useState, useEffect } from 'react';
import { DollarSign, Plus, Trash2, Edit2, X, Home, Car, CreditCard, Wallet, Building, Briefcase } from 'lucide-react';
import { useUserData } from '../../../context/UserDataContext';

const categoryIcons = {
  mortgage: Home,
  vehicle: Car,
  credit: CreditCard,
  personal: Wallet,
  business: Building,
  other: Briefcase
};

export const LiabilitiesTab = () => {
  const { userData, updateLiabilities } = useUserData();
  const [liabilities, setLiabilities] = useState(userData.liabilities);

  // Update local state when userData changes
  useEffect(() => {
    setLiabilities(userData.liabilities);
  }, [userData.liabilities]);

  // Update both local state and context when liabilities change
  const handleLiabilitiesChange = async (newLiabilities) => {
    // Optimistic update
    setLiabilities(newLiabilities);
    updateLiabilities(newLiabilities);
    try {
      const rawUser = localStorage.getItem('userData');
      const currentUser = rawUser ? JSON.parse(rawUser) : null;
      const email = currentUser?.email;
      if (!email) return;

      // Map UI liabilities to API format
      const payload = {
        email,
        liabilities: newLiabilities.map(l => ({
          name: l.name,
          current_balance: l.amount,
          interest_rate: l.interestRate,
          monthly_payment: l.monthlyPayment,
          start_date: l.startDate || null,
          maturity_date: l.endDate || null,
          type: l.category,
        })),
      };
      await fetch('http://127.0.0.1:5000/user/liabilities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // Ask context to refresh from backend
      try { window.dispatchEvent(new Event('user-data-updated')); } catch (_) {}
    } catch (e) {
      console.error('Failed to persist liabilities:', e);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLiability, setSelectedLiability] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    monthlyPayment: '',
    interestRate: '',
    category: 'mortgage',
    startDate: '',
    endDate: '',
    isSecured: false,
    notes: ''
  });

  const handleAdd = () => {
    setIsEditing(false);
    setFormData({
      name: '',
      amount: '',
      monthlyPayment: '',
      interestRate: '',
      category: 'mortgage',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      isSecured: false,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (liability) => {
    setIsEditing(true);
    setSelectedLiability(liability.id);
    setFormData({
      name: liability.name,
      amount: liability.amount.toString(),
      monthlyPayment: liability.monthlyPayment.toString(),
      interestRate: liability.interestRate.toString(),
      category: liability.category,
      startDate: liability.startDate,
      endDate: liability.endDate || '',
      isSecured: liability.isSecured,
      notes: liability.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    const newLiabilities = liabilities.filter(liability => liability.id !== id);
    handleLiabilitiesChange(newLiabilities);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newLiability = {
      id: isEditing ? selectedLiability : Math.random().toString(36).substr(2, 9),
      name: formData.name,
      amount: parseFloat(formData.amount),
      monthlyPayment: parseFloat(formData.monthlyPayment),
      interestRate: parseFloat(formData.interestRate),
      category: formData.category,
      startDate: formData.startDate,
      ...(formData.endDate && { endDate: formData.endDate }),
      isSecured: formData.isSecured,
      ...(formData.notes && { notes: formData.notes })
    };

    if (isEditing) {
      const newLiabilities = liabilities.map(liability => 
        liability.id === selectedLiability ? newLiability : liability
      );
      handleLiabilitiesChange(newLiabilities);
    } else {
      const newLiabilities = [...liabilities, newLiability];
      handleLiabilitiesChange(newLiabilities);
    }

    setIsModalOpen(false);
  };

  const fillDemoData = () => {
    const demoLiabilities = [
      {
        name: "Home Loan",
        amount: "5000000",
        monthlyPayment: "42000",
        interestRate: "7.5",
        category: "mortgage",
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 20)).toISOString().split('T')[0],
        isSecured: true,
        notes: "20-year home loan from SBI"
      },
      {
        name: "Car Loan",
        amount: "800000",
        monthlyPayment: "15000",
        interestRate: "8.5",
        category: "vehicle",
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString().split('T')[0],
        isSecured: true,
        notes: "5-year car loan"
      },
      {
        name: "Credit Card Debt",
        amount: "120000",
        monthlyPayment: "12000",
        interestRate: "36",
        category: "credit",
        startDate: new Date().toISOString().split('T')[0],
        isSecured: false,
        notes: "High-interest credit card balance"
      },
      {
        name: "Personal Loan",
        amount: "300000",
        monthlyPayment: "28000",
        interestRate: "12",
        category: "personal",
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        isSecured: false,
        notes: "1-year personal loan for home renovation"
      },
      {
        name: "Business Loan",
        amount: "2000000",
        monthlyPayment: "45000",
        interestRate: "11",
        category: "business",
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString().split('T')[0],
        isSecured: true,
        notes: "5-year business expansion loan"
      }
    ];

    const randomLiability = demoLiabilities[Math.floor(Math.random() * demoLiabilities.length)];
    setFormData(randomLiability);
  };

  const getTotalLiabilities = () => {
    return liabilities.reduce((total, liability) => total + liability.amount, 0);
  };

  const getTotalMonthlyPayments = () => {
    return liabilities.reduce((total, liability) => total + liability.monthlyPayment, 0);
  };

  const getDebtToIncomeRatio = () => {
    const monthlyIncome = 10000; // This should be fetched from income data
    const monthlyDebt = getTotalMonthlyPayments();
    return (monthlyDebt / monthlyIncome) * 100;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTimeRemaining = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
    return months > 0 ? `${months} months remaining` : 'Due';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-8">
      {/* Header with Stats (match Assets layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white">
          <h3 className="text-lg font-medium opacity-90">Total Liabilities</h3>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-bold">{formatCurrency(getTotalLiabilities())}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Payments</h4>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              {formatCurrency(getTotalMonthlyPayments())}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">/month</span>
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Liabilities</h4>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              {liabilities.length}
            </p>
          </div>
        </div>
      </div>

      {/* Liabilities List */}
      <div className="rounded-lg overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Liabilities</h2>
            <button
              onClick={handleAdd}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Liability
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {liabilities.map((liability) => {
            const Icon = categoryIcons[liability.category];
            const timeRemaining = getTimeRemaining(liability.endDate);
            return (
              <div key={liability.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow m-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-md bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                      <Icon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                        {liability.name}
                        {liability.isSecured && (
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            Secured
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <span>{formatCurrency(liability.monthlyPayment)}/month</span>
                        <span>•</span>
                        <span>{liability.interestRate}% APR</span>
                        {timeRemaining && (
                          <>
                            <span>•</span>
                            <span>{timeRemaining}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-medium text-gray-900 dark:text-white">
                      {formatCurrency(liability.amount)}
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEdit(liability)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(liability.id)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                {liability.notes && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 pl-11">
                    {liability.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {isEditing ? 'Edit Liability' : 'Add New Liability'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Liability Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Total Amount
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">₹</span>
                    </div>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-8 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Payment
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">₹</span>
                    </div>
                    <input
                      type="number"
                      value={formData.monthlyPayment}
                      onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })}
                      className="w-full pl-8 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  >
                    {Object.keys(categoryIcons).map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isSecured"
                  checked={formData.isSecured}
                  onChange={(e) => setFormData({ ...formData, isSecured: e.target.checked })}
                  className="h-4 w-4 text-gray-600 border-gray-300 rounded"
                />
                <label htmlFor="isSecured" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  This is a secured liability (backed by collateral)
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  rows={3}
                  placeholder="Add any additional information about this liability"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={fillDemoData}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Demo Data
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500"
                >
                  {isEditing ? 'Save Changes' : 'Add Liability'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
