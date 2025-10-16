import { useState, useEffect } from 'react';
import { Target, DollarSign, Home, Briefcase, GraduationCap, Car, Plus, Trash2, X, Edit2 } from 'lucide-react';
import { useUserData } from '../../../context/UserDataContext';

const formatToINR = (amount) => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[₹,]/g, '')) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(numericAmount);
};

export const GoalsTab = () => {
  const { userData, updateGoals } = useUserData();
  const [goals, setGoals] = useState(userData.goals);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    priority: 'medium',
    description: ''
  });

  // Update local state when userData changes
  useEffect(() => {
    setGoals(userData.goals);
  }, [userData.goals]);

  // Update both local state and context when goals change
  const handleGoalsChange = async (newGoals) => {
    // Optimistic update
    setGoals(newGoals);
    updateGoals(newGoals);
    try {
      const rawUser = localStorage.getItem('userData');
      const currentUser = rawUser ? JSON.parse(rawUser) : null;
      const email = currentUser?.email;
      if (!email) return;

      // Map UI goals to API format
      const payload = {
        email,
        goals: newGoals.map(g => ({
          title: g.name,
          target_amount: g.targetAmount,
          current_amount: g.currentAmount || 0,
          target_date: g.deadline,
          priority: g.priority,
          description: g.description || ''
        })),
      };
      await fetch('http://127.0.0.1:5000/user/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // Ask context to refresh from backend
      try { window.dispatchEvent(new Event('user-data-updated')); } catch (_) {}
    } catch (e) {
      console.error('Failed to persist goals:', e);
    }
  };

  const handleAdd = () => {
    setIsEditing(false);
    setSelectedGoal(null);
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: '',
      deadline: '',
      priority: 'medium',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (goal) => {
    setIsEditing(true);
    setSelectedGoal(goal.id);
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      deadline: goal.deadline,
      priority: goal.priority,
      description: goal.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    const newGoals = goals.filter(goal => goal.id !== id);
    handleGoalsChange(newGoals);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newGoal = {
      id: isEditing ? selectedGoal : Math.random().toString(36).substr(2, 9),
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount || 0),
      deadline: formData.deadline,
      priority: formData.priority,
      description: formData.description
    };

    if (isEditing) {
      const newGoals = goals.map(goal => goal.id === selectedGoal ? newGoal : goal);
      handleGoalsChange(newGoals);
    } else {
      const newGoals = [...goals, newGoal];
      handleGoalsChange(newGoals);
    }

    setIsModalOpen(false);
  };

  const getProgress = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Goals</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track your financial objectives</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => (
          <div key={goal.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg">
                  <Target className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{goal.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    goal.priority === 'high' ? 'bg-red-100 text-red-800' :
                    goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {goal.priority}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(goal)}
                  className="text-gray-400 hover:text-indigo-600"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(goal.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{getProgress(goal.currentAmount, goal.targetAmount).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${getProgress(goal.currentAmount, goal.targetAmount)}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Current</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{formatToINR(goal.currentAmount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Target</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{formatToINR(goal.targetAmount)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Deadline</p>
                <p className="text-sm text-gray-900 dark:text-white">{new Date(goal.deadline).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isEditing ? 'Edit Goal' : 'Add New Goal'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Goal Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({...formData, currentAmount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  {isEditing ? 'Update Goal' : 'Add Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsTab;