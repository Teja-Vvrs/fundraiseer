import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizationAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const OrganizationVerification = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verification, setVerification] = useState(null);
  const [formData, setFormData] = useState({
    organizationName: '',
    registrationNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },
    contactPerson: {
      name: '',
      position: '',
      phone: '',
      email: ''
    },
    socialProfiles: {
      website: '',
      facebook: '',
      twitter: '',
      linkedin: ''
    }
  });

  const [documents, setDocuments] = useState({
    registrationCertificate: null,
    taxCertificate: null,
    bankStatement: null,
    governmentId: null
  });

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const response = await organizationAPI.getVerificationStatus();
      setVerification(response.data);
      if (response.data) {
        setFormData({
          organizationName: response.data.organizationName || '',
          registrationNumber: response.data.registrationNumber || '',
          address: response.data.address || formData.address,
          contactPerson: response.data.contactPerson || formData.contactPerson,
          socialProfiles: response.data.socialProfiles || formData.socialProfiles
        });
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        toast.error('Failed to fetch verification status');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, section = null) => {
    const { name, value } = e.target;
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = async (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const response = await organizationAPI.uploadDocument(file, documentType);
      setDocuments(prev => ({
        ...prev,
        [documentType]: response.data.url
      }));
      toast.success(`${documentType} uploaded successfully`);
    } catch (error) {
      toast.error(`Failed to upload ${documentType}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = {
        ...formData,
        documents
      };

      if (verification) {
        await organizationAPI.updateVerification(data);
        toast.success('Verification request updated successfully');
      } else {
        await organizationAPI.submitVerification(data);
        toast.success('Verification request submitted successfully');
      }

      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit verification request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (verification?.verificationStatus === 'verified') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Organization Verified</h2>
          <p className="text-green-700">Your organization has been verified. You can now create fundraising campaigns.</p>
          <button
            onClick={() => navigate('/create-campaign')}
            className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Create Campaign
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {verification ? 'Update Organization Verification' : 'Organization Verification'}
        </h2>

        {verification?.verificationStatus === 'rejected' && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">Verification Rejected</h3>
            <p className="text-red-700">
              {verification.verificationNotes?.[verification.verificationNotes.length - 1]?.note || 
                'Your verification request was rejected. Please update your information and try again.'}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Organization Name</label>
              <input
                type="text"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Registration Number</label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Street</label>
                <input
                  type="text"
                  name="street"
                  value={formData.address.street}
                  onChange={(e) => handleInputChange(e, 'address')}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange(e, 'address')}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.address.state}
                  onChange={(e) => handleInputChange(e, 'address')}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.address.country}
                  onChange={(e) => handleInputChange(e, 'address')}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.address.postalCode}
                  onChange={(e) => handleInputChange(e, 'address')}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Person</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.contactPerson.name}
                  onChange={(e) => handleInputChange(e, 'contactPerson')}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Position</label>
                <input
                  type="text"
                  name="position"
                  value={formData.contactPerson.position}
                  onChange={(e) => handleInputChange(e, 'contactPerson')}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.contactPerson.phone}
                  onChange={(e) => handleInputChange(e, 'contactPerson')}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.contactPerson.email}
                  onChange={(e) => handleInputChange(e, 'contactPerson')}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Social Profiles */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Social Profiles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.socialProfiles.website}
                  onChange={(e) => handleInputChange(e, 'socialProfiles')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Facebook</label>
                <input
                  type="url"
                  name="facebook"
                  value={formData.socialProfiles.facebook}
                  onChange={(e) => handleInputChange(e, 'socialProfiles')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Twitter</label>
                <input
                  type="url"
                  name="twitter"
                  value={formData.socialProfiles.twitter}
                  onChange={(e) => handleInputChange(e, 'socialProfiles')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">LinkedIn</label>
                <input
                  type="url"
                  name="linkedin"
                  value={formData.socialProfiles.linkedin}
                  onChange={(e) => handleInputChange(e, 'socialProfiles')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Document Upload */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Required Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Registration Certificate</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'registrationCertificate')}
                  required={!verification?.documents?.registrationCertificate?.url}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tax Certificate</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'taxCertificate')}
                  required={!verification?.documents?.taxCertificate?.url}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bank Statement</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'bankStatement')}
                  required={!verification?.documents?.bankStatement?.url}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Government ID</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'governmentId')}
                  required={!verification?.documents?.governmentId?.url}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : verification ? 'Update Verification' : 'Submit Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganizationVerification; 