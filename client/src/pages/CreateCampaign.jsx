import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignAPI } from '../utils/api';
import { toast } from 'react-toastify';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'education',
    goalAmount: '',
    deadline: '',
    mediaUrls: [''], // For now, just one image URL
    fundUtilizationPlan: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = ['education', 'medical', 'environment', 'technology', 'community', 'other'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await campaignAPI.createCampaign({
        ...formData,
        goalAmount: Number(formData.goalAmount),
        fundUtilizationPlan: 'Default plan' // Add a default plan since it's required
      });
      
      if (!response.data || !response.data.campaign) {
        throw new Error('Invalid response from server');
      }
      
      toast.success('Campaign created successfully!');
      navigate(`/campaigns/${response.data.campaign._id}`);
    } catch (err) {
      console.error('Campaign creation error:', err);
        setError(err.response?.data?.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  // Calculate minimum date for deadline (today)
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-50 py-6 sm:py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 lg:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Create a Campaign</h1>

          {error && (
            <div className="error-container bg-red-50 text-red-500 p-4 rounded-lg mb-6 text-center">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Campaign Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                placeholder="Enter campaign title"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="6"
                className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 resize-y"
                placeholder="Describe your campaign"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              <div>
                <label htmlFor="goalAmount" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Goal Amount ($)
                </label>
                <input
                  type="number"
                  id="goalAmount"
                  name="goalAmount"
                  value={formData.goalAmount}
                  onChange={handleChange}
                  required
                  min="1"
                  step="1"
                  className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Enter goal amount"
                />
              </div>

              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Campaign Deadline
                </label>
                <input
                  type="date"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  required
                  min={minDate}
                  className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                />
              </div>
            </div>

            <div>
              <label htmlFor="mediaUrl" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Campaign Image URL
              </label>
              <input
                type="url"
                id="mediaUrl"
                name="mediaUrls"
                value={formData.mediaUrls[0]}
                onChange={(e) => setFormData(prev => ({ ...prev, mediaUrls: [e.target.value] }))}
                className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200"
                placeholder="Enter image URL"
              />
            </div>

            <div>
              <label htmlFor="fundUtilizationPlan" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Fund Utilization Plan
              </label>
              <textarea
                id="fundUtilizationPlan"
                name="fundUtilizationPlan"
                value={formData.fundUtilizationPlan}
                onChange={handleChange}
                required
                rows="4"
                className="w-full rounded-lg border border-gray-300 px-3 sm:px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors duration-200 resize-y"
                placeholder="Describe how you plan to use the funds raised"
              />
              <p className="mt-1 text-sm text-gray-500">
                Please provide a detailed plan of how you intend to utilize the funds raised through this campaign.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-2">
              <button
                type="button"
                onClick={() => navigate('/campaigns')}
                className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`w-full sm:w-auto px-6 py-2.5 text-white font-medium rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {loading ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaign; 