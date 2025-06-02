import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { contactAPI } from '../utils/api';
import { toast } from 'react-toastify';

const UserMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Function to fetch messages
  const fetchUserMessages = async () => {
    try {
      setLoading(true);
      console.log('Fetching messages - Current auth state:', {
        user,
        isAuthenticated: !!user,
        userId: user?._id
      });
      
      const response = await contactAPI.getUserMessages(page);
      console.log('Raw API response:', response);
      
      if (!response.data) {
        console.error('No data received from server');
        throw new Error('No data received from server');
      }

      if (!Array.isArray(response.data.messages)) {
        console.error('Invalid messages format:', response.data);
        throw new Error('Invalid response format - messages is not an array');
      }
      
      setMessages(response.data.messages);
      setTotalPages(response.data.totalPages || 1);

      // If there are in-progress messages, set up refresh interval
      if (response.data.hasInProgress) {
        setupRefreshInterval();
      } else {
        clearRefreshInterval();
      }
      
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch messages';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Set up refresh interval for in-progress messages
  const setupRefreshInterval = () => {
    if (!refreshInterval) {
      const interval = setInterval(() => {
        fetchUserMessages();
      }, 10000); // Refresh every 10 seconds
      setRefreshInterval(interval);
    }
  };

  // Clear refresh interval
  const clearRefreshInterval = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  };

  // Initial fetch and cleanup
  useEffect(() => {
    fetchUserMessages();
    return () => clearRefreshInterval();
  }, [page]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'unread':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Messages</h1>
          {loading && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-600 mr-2"></div>
              Refreshing...
            </div>
          )}
        </div>

        {messages.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">You haven't sent any messages yet.</p>
            <a href="/contact" className="text-indigo-600 hover:text-indigo-700 mt-2 inline-block">
              Contact Us
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message) => (
              <div key={message._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white">{message.subject}</h2>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeClass(message.status)}`}>
                      {message.status === 'in-progress' ? 'In Progress' : 
                       message.status === 'resolved' ? 'Resolved' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-sm text-indigo-100 mt-1">
                    Sent on {new Date(message.createdAt).toLocaleDateString()} at {new Date(message.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Your Message:</h3>
                    <p className="text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">{message.message}</p>
                  </div>

                  {message.adminResponse ? (
                    <div className="mt-6 bg-green-50 rounded-lg p-4 border border-green-100">
                      <div className="flex items-center mb-2">
                        <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-sm font-medium text-gray-700">Admin Response:</h3>
                        {message.respondedBy && (
                          <span className="ml-2 text-sm text-gray-500">
                            by {message.respondedBy.name}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 whitespace-pre-wrap">{message.adminResponse}</p>
                      {message.respondedAt && (
                      <p className="text-sm text-gray-500 mt-2">
                          Responded on {new Date(message.respondedAt).toLocaleDateString()} at {new Date(message.respondedAt).toLocaleTimeString()}
                      </p>
                      )}
                    </div>
                  ) : message.status === 'in-progress' ? (
                    <div className="mt-6 bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-yellow-800">Your message is being reviewed by our team. We'll respond soon.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-gray-600">Awaiting response from our team.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                    ${page === i + 1
                      ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMessages; 