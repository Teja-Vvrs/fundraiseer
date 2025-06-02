import { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';
import { toast } from 'react-toastify';

const AdminVerificationManager = ({ type = 'organization' }) => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [reviewNote, setReviewNote] = useState('');
  const [documentVerification, setDocumentVerification] = useState({});

  const isOrganization = type === 'organization';

  useEffect(() => {
    fetchVerifications();
  }, [statusFilter, type]);

  const fetchVerifications = async () => {
    try {
      if (isOrganization) {
        const response = await adminAPI.getVerificationRequests({ status: statusFilter });
        setVerifications(response.data.verifications);
      } else {
        // For campaign verifications
        const response = await adminAPI.getPendingCampaigns();
        setVerifications(response.data);
      }
    } catch (err) {
      setError(`Failed to load ${isOrganization ? 'organization' : 'campaign'} verification requests`);
      toast.error(`Failed to load ${isOrganization ? 'organization' : 'campaign'} verification requests`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationClick = (verification) => {
    setSelectedVerification(verification);
    if (isOrganization) {
      setDocumentVerification({
        registrationCertificate: verification.documents.registrationCertificate?.verified || false,
        taxCertificate: verification.documents.taxCertificate?.verified || false,
        bankStatement: verification.documents.bankStatement?.verified || false,
        governmentId: verification.documents.governmentId?.verified || false
      });
    }
  };

  const handleDocumentVerification = (docType) => {
    setDocumentVerification(prev => ({
      ...prev,
      [docType]: !prev[docType]
    }));
  };

  const handleReview = async (status) => {
    try {
      if (isOrganization) {
        await adminAPI.reviewVerification(selectedVerification._id, {
          status,
          note: reviewNote
        });
      } else {
        await adminAPI.moderateCampaign(selectedVerification._id, status);
      }

      toast.success(`${isOrganization ? 'Organization' : 'Campaign'} ${status === 'verified' ? 'verified' : 'rejected'} successfully`);
      setSelectedVerification(null);
      setReviewNote('');
      fetchVerifications();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to update ${isOrganization ? 'organization' : 'campaign'} status`);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {isOrganization ? 'Organization Verifications' : 'Campaign Verifications'}
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 rounded-lg ${
                  statusFilter === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('verified')}
                className={`px-4 py-2 rounded-lg ${
                  statusFilter === 'verified' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                }`}
              >
                Verified
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-4 py-2 rounded-lg ${
                  statusFilter === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100'
                }`}
              >
                Rejected
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {isOrganization ? 'Organization' : 'Campaign'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {isOrganization ? 'Registration' : 'Creator'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {isOrganization ? 'Contact' : 'Goal Amount'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {verifications.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {isOrganization ? item.organizationName : item.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {isOrganization ? item.registrationNumber : (item.creatorId?.name || 'Unknown')}
                      </div>
                      {!isOrganization && item.creatorId?.email && (
                        <div className="text-sm text-gray-500">
                          {item.creatorId.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isOrganization ? (
                        <>
                          <div className="text-sm text-gray-900">
                            {item.contactPerson?.name || item.contactPerson?.email || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.contactPerson?.email}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-900">
                          ${item.goalAmount?.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(isOrganization ? item.verificationStatus : item.status)}`}>
                        {((isOrganization ? item.verificationStatus : item.status) || 'pending').charAt(0).toUpperCase() + 
                         ((isOrganization ? item.verificationStatus : item.status) || 'pending').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleVerificationClick(item)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Verification Review Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Review Organization Verification
              </h2>
              <button
                onClick={() => setSelectedVerification(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Details</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="text-sm text-gray-900">{selectedVerification.organizationName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Registration Number</dt>
                    <dd className="text-sm text-gray-900">{selectedVerification.registrationNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Address</dt>
                    <dd className="text-sm text-gray-900">
                      {selectedVerification.address ? 
                        `${selectedVerification.address.street || ''}, 
                         ${selectedVerification.address.city || ''}, 
                         ${selectedVerification.address.state || ''}, 
                         ${selectedVerification.address.country || ''} 
                         ${selectedVerification.address.postalCode || ''}`.replace(/\s+/g, ' ').trim() 
                        : 'No address provided'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Person</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="text-sm text-gray-900">
                      {selectedVerification.contactPerson?.name || 'Not provided'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Position</dt>
                    <dd className="text-sm text-gray-900">
                      {selectedVerification.contactPerson?.position || 'Not provided'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Contact</dt>
                    <dd className="text-sm text-gray-900">
                      {selectedVerification.contactPerson?.email || 'No email provided'}
                      <br />
                      {selectedVerification.contactPerson?.phone || 'No phone provided'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Document Verification</h3>
              <div className="space-y-4">
                {selectedVerification.documents && Object.entries(selectedVerification.documents).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={documentVerification[key] || false}
                        onChange={() => handleDocumentVerification(key)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </p>
                        {value?.url && (
                          <a
                            href={value.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                          >
                            View Document
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="reviewNote" className="block text-sm font-medium text-gray-700 mb-2">
                Review Note
              </label>
              <textarea
                id="reviewNote"
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Add a note about your decision..."
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => handleReview('rejected')}
                className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-md"
              >
                Reject
              </button>
              <button
                onClick={() => handleReview('verified')}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-md"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVerificationManager; 