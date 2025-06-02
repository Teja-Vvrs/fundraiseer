import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import { FaEye, FaEyeSlash, FaCheck, FaTimes, FaInfoCircle } from 'react-icons/fa';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState(() => {
    // Get email from localStorage if it exists
    const resetEmail = localStorage.getItem('resetEmail');
    if (resetEmail) {
      // Clear it from localStorage
      localStorage.removeItem('resetEmail');
      return resetEmail;
    }
    return '';
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [entropyScore, setEntropyScore] = useState(0);
  const [validationStatus, setValidationStatus] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  const navigate = useNavigate();

  const requirements = [
    { 
      key: 'length', 
      label: 'At least 8 characters',
      tooltip: 'Your password should be at least 8 characters long for better security',
      suggestion: 'Try adding more characters to make your password longer'
    },
    { 
      key: 'uppercase', 
      label: 'One uppercase letter',
      tooltip: 'Include at least one capital letter (A-Z)',
      suggestion: 'Add a capital letter to make your password stronger'
    },
    { 
      key: 'lowercase', 
      label: 'One lowercase letter',
      tooltip: 'Include at least one lowercase letter (a-z)',
      suggestion: 'Add a lowercase letter to improve your password'
    },
    { 
      key: 'number', 
      label: 'One number',
      tooltip: 'Include at least one number (0-9)',
      suggestion: 'Add a number to strengthen your password'
    },
    { 
      key: 'special', 
      label: 'One special character',
      tooltip: 'Include at least one special character (!@#$%^&*)',
      suggestion: 'Add a special character (!@#$%^&*) to enhance security'
    }
  ];

  const calculatePasswordEntropy = (password) => {
    let charset = 0;
    if (/[a-z]/.test(password)) charset += 26;
    if (/[A-Z]/.test(password)) charset += 26;
    if (/[0-9]/.test(password)) charset += 10;
    if (/[!@#$%^&*]/.test(password)) charset += 8;
    
    const entropy = Math.log2(Math.pow(charset, password.length));
    return Math.min(100, (entropy / 100) * 100); // Normalize to 0-100
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[!@#$%^&*]/.test(password)) strength += 20;
    return strength;
  };

  const getStrengthLabel = (strength, entropy) => {
    const combinedScore = (strength + entropy) / 2;
    if (combinedScore < 20) return { label: 'Very Weak', color: 'red-600' };
    if (combinedScore < 40) return { label: 'Weak', color: 'red-400' };
    if (combinedScore < 60) return { label: 'Fair', color: 'yellow-500' };
    if (combinedScore < 80) return { label: 'Strong', color: 'green-500' };
    return { label: 'Very Strong', color: 'green-600' };
  };

  const validatePassword = (password) => {
    const status = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password)
    };
    setValidationStatus(status);
    return Object.values(status).every(Boolean) ? [] : ['Please meet all password requirements'];
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setNewPassword(password);
    const strength = calculatePasswordStrength(password);
    const entropy = calculatePasswordEntropy(password);
    setPasswordStrength(strength);
    setEntropyScore(entropy);
    validatePassword(password);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    const errors = validatePassword(newPassword);
    if (errors.length > 0) {
      showErrorToast('Please fix password validation errors');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      showErrorToast('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.resetPassword({ email, newPassword });
      showSuccessToast(response.data.message || 'Password reset successful! Please login with your new password.');
      // Clear any stored email
      localStorage.removeItem('resetEmail');
      navigate('/login');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to reset password';
      showErrorToast(errorMessage);
      console.error('Password reset error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              back to login
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          <div className="relative space-y-2">
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <div className="mt-1 relative rounded-lg shadow-sm">
              <input
                id="newPassword"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={handlePasswordChange}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10"
                placeholder="Enter new password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FaEyeSlash className="h-5 w-5 text-gray-400" />
                ) : (
                  <FaEye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>

            {/* Enhanced Password Strength Indicator */}
            {newPassword && (
              <div className="space-y-4 mt-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700">Password Strength:</h4>
                    <span className={`text-sm font-medium text-${getStrengthLabel(passwordStrength, entropyScore).color}`}>
                      {getStrengthLabel(passwordStrength, entropyScore).label}
                    </span>
                  </div>
                  
                  {/* Animated strength bar */}
                  <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ease-out transform ${
                        getStrengthLabel(passwordStrength, entropyScore).color === 'red-600'
                          ? 'bg-red-600'
                          : getStrengthLabel(passwordStrength, entropyScore).color === 'red-400'
                          ? 'bg-red-400'
                          : getStrengthLabel(passwordStrength, entropyScore).color === 'yellow-500'
                          ? 'bg-yellow-500'
                          : getStrengthLabel(passwordStrength, entropyScore).color === 'green-500'
                          ? 'bg-green-500'
                          : 'bg-green-600'
                      }`}
                      style={{ width: `${(passwordStrength + entropyScore) / 2}%` }}
                    />
                  </div>
                </div>

                {/* Password Requirements with Tooltips */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Password Requirements:</h4>
                  <ul className="space-y-3">
                    {requirements.map(({ key, label, tooltip, suggestion }) => (
                      <li key={key} className="flex items-center text-sm group">
                        <div className="flex-shrink-0 w-6">
                          {validationStatus[key] ? (
                            <FaCheck className="h-4 w-4 text-green-500 transition-transform duration-200 transform group-hover:scale-110" />
                          ) : (
                            <FaTimes className="h-4 w-4 text-red-500 transition-transform duration-200 transform group-hover:scale-110" />
                          )}
                        </div>
                        <span 
                          className={`flex-grow ${validationStatus[key] ? 'text-green-700' : 'text-red-700'}`}
                          data-tooltip-id={`tooltip-${key}`}
                          data-tooltip-content={validationStatus[key] ? tooltip : suggestion}
                        >
                          {label}
                          <FaInfoCircle className="inline-block ml-1 h-4 w-4 text-gray-400 opacity-50 group-hover:opacity-100 transition-opacity duration-200" />
                        </span>
                        <Tooltip id={`tooltip-${key}`} place="right" />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <div className="mt-1 relative rounded-lg shadow-sm">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${
                  confirmPassword && newPassword !== confirmPassword
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-indigo-500'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent pr-10 transition-colors duration-200`}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <FaEyeSlash className="h-5 w-5 text-gray-400" />
                ) : (
                  <FaEye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="mt-1 text-sm text-red-600 animate-pulse">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !Object.values(validationStatus).every(Boolean) || newPassword !== confirmPassword}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ${
              (loading || !Object.values(validationStatus).every(Boolean) || newPassword !== confirmPassword)
                ? 'opacity-75 cursor-not-allowed'
                : 'transform hover:-translate-y-0.5'
            }`}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword; 