import { Fragment, useState } from 'react';
import { Link, Outlet, useLocation, NavLink } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  HomeIcon,
  XMarkIcon,
  Bars3Icon,
  UserGroupIcon,
  ChartBarIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Campaigns', href: '/admin/campaigns', icon: ChartBarIcon },
  { name: 'Users', href: '/admin/users', icon: UserGroupIcon },
  { name: 'Messages', href: '/admin/contacts', icon: EnvelopeIcon },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this area.</p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Admin Navigation */}
        <nav className="bg-white shadow-md rounded-lg mb-6">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-xl font-bold text-indigo-600">Admin</h1>
                </div>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    <NavLink
                      to="/admin"
                      end
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-md text-sm font-medium ${
                          isActive
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`
                      }
                    >
                      Dashboard
                    </NavLink>
                    <NavLink
                      to="/admin/campaigns"
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-md text-sm font-medium ${
                          isActive
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`
                      }
                    >
                      Campaigns
                    </NavLink>
                    <NavLink
                      to="/admin/users"
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-md text-sm font-medium ${
                          isActive
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`
                      }
                    >
                      Users
                    </NavLink>
                    <NavLink
                      to="/admin/contacts"
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-md text-sm font-medium ${
                          isActive
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`
                      }
                    >
                      Contact Management
                    </NavLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 