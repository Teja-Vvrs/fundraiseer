import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Bars3Icon, 
  XMarkIcon,
  UserIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  GlobeAmericasIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const profileDropdownRef = useRef(null);

  // Close profile dropdown when changing routes
  useEffect(() => {
    setIsProfileOpen(false);
  }, [location.pathname]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center space-x-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center relative group overflow-hidden">
                <GlobeAmericasIcon className="w-6 h-6 text-white absolute transform transition-all duration-500 group-hover:rotate-180" />
                <BanknotesIcon className="w-6 h-6 text-white/80 absolute transform transition-all duration-500 -rotate-45 group-hover:rotate-0" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Funderra
              </span>
            </Link>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/campaigns"
                className={({ isActive }) =>
                  `inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                  }`
                }
              >
                Campaigns
              </NavLink>
              {(!user || user.role !== 'admin') && (
                <NavLink
                  to="/contact"
                  className={({ isActive }) =>
                    `inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                    }`
                  }
                >
                  Contact Us
                </NavLink>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {user ? (
              <>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                    }`
                  }
                >
                  Dashboard
                </NavLink>
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:text-indigo-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-600">
                        {user.name?.[0] || user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <span>{user.name || 'Profile'}</span>
                  </button>
                  {isProfileOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none transform opacity-100 scale-100 transition-all duration-200 z-50">
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <UserIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-indigo-600" />
                          Your Profile
                        </Link>
                        {user.role === 'admin' && (
                          <Link
                            to="/admin"
                            className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <CogIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-indigo-600" />
                            Admin Panel
                          </Link>
                        )}
                      </div>
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-indigo-600" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transform transition-all duration-200 hover:-translate-y-0.5"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-all duration-200"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" />
              ) : (
                <Bars3Icon className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`sm:hidden transition-all duration-200 ease-in-out ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `block px-3 py-2 text-base font-medium rounded-md transition-all duration-200 ${
                isActive
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
              }`
            }
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </NavLink>
          <NavLink
            to="/campaigns"
            className={({ isActive }) =>
              `block px-3 py-2 text-base font-medium rounded-md transition-all duration-200 ${
                isActive
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
              }`
            }
            onClick={() => setIsMenuOpen(false)}
          >
            Campaigns
          </NavLink>
          {(!user || user.role !== 'admin') && (
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `block px-3 py-2 text-base font-medium rounded-md transition-all duration-200 ${
                  isActive
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                }`
              }
              onClick={() => setIsMenuOpen(false)}
            >
              Contact Us
            </NavLink>
          )}
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200">
          {user ? (
            <div className="space-y-1">
              <div className="px-4 py-2">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-lg font-medium text-indigo-600">
                      {user.name?.[0] || user.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{user.name || 'User'}</div>
                    <div className="text-sm font-medium text-gray-500">{user.email}</div>
                  </div>
                </div>
              </div>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `block px-3 py-2 text-base font-medium rounded-md transition-all duration-200 ${
                    isActive
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                  }`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </NavLink>
              <Link
                to="/profile"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-all duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Your Profile
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-all duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-all duration-200"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-1 px-2">
              <Link
                to="/login"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-all duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="block px-3 py-2 text-base font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-md hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 