import { Link, useLocation } from 'react-router-dom';
import { BarChart2, BookOpen, TrendingUp, User, LineChart, LayoutDashboard, Database, MessageSquare, Calculator, LogOut } from 'lucide-react';
// Clerk removed

const Sidebar = ({ isOpen = false, onClose }) => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('userData') || '{}');

  const userName = user?.name || 'User';
  const userEmail = user?.email || 'email@example.com';

  const handleLogout = () => {
    localStorage.removeItem('userData');
    localStorage.removeItem('currentUserEmail');
    window.location.href = '/'; // Redirect to home page
  };

  const menuItems = [
    { path: '/portfolio', icon: LayoutDashboard, label: 'Portfolio', tourClass: 'tour-portfolio' },
    { path: '/portfolio/my-data', icon: Database, label: 'My Data', tourClass: 'tour-my-data' },
    { path: '/portfolio/recommendations', icon: TrendingUp, label: 'Recommendations', tourClass: 'tour-recommendations' },
    { path: '/portfolio/learn', icon: BookOpen, label: 'Money Matters', tourClass: 'tour-learn' },
    { path: '/portfolio/financial-path', icon: BarChart2, label: 'Financial Path', tourClass: 'tour-financial-path' },
    { path: '/portfolio/money-calc', icon: Calculator, label: 'Money Calculator', tourClass: 'tour-money-calc' },
    { path: '/portfolio/chatbot', icon: MessageSquare, label: 'AI Assistant', tourClass: 'tour-ai-assistant' },
    { path: '/portfolio/stock-analyzer', icon: LineChart, label: 'Stock Analyzer', tourClass: 'tour-stock-analyzer' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center tour-logo">
              <BarChart2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">WealthWise</span>
            </Link>
            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    } ${item.tourClass}`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Link 
            to="/portfolio/profile"
            className="flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors p-2 rounded-lg group tour-profile"
          >
            {user.imageUrl ? (
              <img 
                src={user.imageUrl} 
                alt="Profile" 
                className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-500 dark:ring-indigo-400"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {userName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {userEmail}
              </p>
            </div>
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors p-2 rounded-lg group mt-2"
          >
            <LogOut className="h-5 w-5 text-red-500 dark:text-red-400" />
            <span className="text-sm font-medium text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300">
              Sign Out
            </span>
          </button>
        </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
