import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { adminAPI } from '../utils/api';

const AdminContactManager = () => {
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedContact, setSelectedContact] = useState(null);
  const [response, setResponse] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchContacts = async () => {
    try {
      const result = await adminAPI.getContacts({
        page: currentPage,
        status: statusFilter
      });
      
      if (!result.data || !Array.isArray(result.data.contacts)) {
        throw new Error('Invalid response format');
      }
      
      setContacts(result.data.contacts);
      setTotalPages(result.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch contact submissions');
      setContacts([]);
      setTotalPages(1);
    }
  };

  const fetchStats = async () => {
    try {
      const result = await adminAPI.getContactStats();
      if (!result.data) {
        throw new Error('Invalid stats response');
      }
      setStats(result.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to fetch contact statistics');
      setStats({
        unread: 0,
        'in-progress': 0,
        resolved: 0,
        total: 0
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchContacts(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, [currentPage, statusFilter]);

  const handleStatusChange = async (contactId, newStatus) => {
    if (!contactId || !newStatus) {
      toast.error('Invalid contact or status');
      return;
    }

    try {
      const result = await adminAPI.updateContactStatus(contactId, {
        status: newStatus,
        adminResponse: response.trim()
      });

      if (!result.data) {
        throw new Error('Failed to update contact');
      }

      setSelectedContact(null);
      setResponse('');
      toast.success('Contact updated successfully');
      await Promise.all([fetchContacts(), fetchStats()]);
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error(error.response?.data?.message || 'Failed to update contact');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Contact Management</h1>

      {/* Stats Section */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium">Unread</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.unread || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium">In Progress</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats['in-progress'] || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium">Resolved</h3>
          <p className="text-3xl font-bold text-green-600">{stats.resolved || 0}</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="mt-1 block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="">All Status</option>
          <option value="unread">Unread</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contacts.map((contact) => (
              <tr key={contact._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(contact.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                  <div className="text-sm text-gray-500">{contact.email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{contact.subject}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${contact.status === 'resolved' ? 'bg-green-100 text-green-800' : 
                      contact.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'}`}>
                    {contact.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => setSelectedContact(contact)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-center">
        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setCurrentPage(i + 1)}
              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                ${currentPage === i + 1
                  ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
            >
              {i + 1}
            </button>
          ))}
        </nav>
      </div>

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="absolute top-4 right-4">
              <button
                onClick={() => {
                  setSelectedContact(null);
                  setResponse('');
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Contact Details</h3>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full 
                  ${selectedContact.status === 'resolved' ? 'bg-green-100 text-green-800' : 
                    selectedContact.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-gray-100 text-gray-800'}`}>
                  {selectedContact.status}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium text-gray-700">Name:</span><br />
                      {selectedContact.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium text-gray-700">Email:</span><br />
                      {selectedContact.email}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">
                      <span className="font-medium text-gray-700">Subject:</span><br />
                      {selectedContact.subject}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">
                      <span className="font-medium text-gray-700">Submitted on:</span><br />
                      {new Date(selectedContact.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">Message:</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedContact.message}</p>
                </div>
              </div>

              {selectedContact.adminResponse && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2">Previous Response:</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedContact.adminResponse}</p>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block font-medium text-gray-700 mb-2">
                  Your Response
                </label>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Type your response here..."
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedContact(null);
                    setResponse('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStatusChange(selectedContact._id, 'in-progress')}
                  className="px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-lg hover:bg-yellow-200"
                  disabled={selectedContact.status === 'in-progress'}
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => handleStatusChange(selectedContact._id, 'resolved')}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                  disabled={!response.trim() || selectedContact.status === 'resolved'}
                >
                  Resolve & Send Response
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContactManager; 