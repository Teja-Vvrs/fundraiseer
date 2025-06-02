import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import React from 'react';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './context/AuthContext';
import Footer from './components/Footer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ForgotPassword from './pages/ForgotPassword';
import AdminRoute from './components/AdminRoute';

// Lazy load components for better performance
const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Campaigns = React.lazy(() => import('./pages/Campaigns'));
const CampaignDetails = React.lazy(() => import('./pages/CampaignDetails'));
const CreateCampaign = React.lazy(() => import('./pages/CreateCampaign'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Profile = React.lazy(() => import('./pages/Profile'));
const ContactUs = React.lazy(() => import('./pages/ContactUs'));
const UserMessages = React.lazy(() => import('./pages/UserMessages'));

// Admin components
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminPanel = React.lazy(() => import('./pages/AdminPanel'));
const AdminContactManager = React.lazy(() => import('./pages/AdminContactManager'));
const AdminLayout = React.lazy(() => import('./components/AdminLayout'));

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <React.Suspense fallback={
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/campaigns/:campaignId" element={
                <React.Suspense fallback={
                  <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                  </div>
                }>
                  <CampaignDetails />
                </React.Suspense>
              } />
              <Route path="/contact" element={<ContactUs />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/create-campaign" element={<CreateCampaign />} />
                <Route path="/messages" element={<UserMessages />} />
              </Route>

              {/* Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="campaigns" element={<AdminPanel defaultTab="campaigns" />} />
                  <Route path="users" element={<AdminPanel defaultTab="users" />} />
                  <Route path="contacts" element={<AdminContactManager />} />
                </Route>
              </Route>

              {/* 404 Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </React.Suspense>
          <Footer />
          <ToastContainer position="bottom-right" />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;