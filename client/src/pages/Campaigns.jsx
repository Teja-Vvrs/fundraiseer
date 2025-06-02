import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { campaignAPI } from '../utils/api';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, [page, selectedCategory, showCompleted]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        includeCompleted: showCompleted
      };
      const response = await campaignAPI.getAllCampaigns(params);
      setCampaigns(response.data.campaigns);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'education', 'medical', 'environment', 'technology', 'community', 'other'];

  const getStatusBadgeClass = (status, isFunded) => {
    if (isFunded) return 'bg-green-100 text-green-800';
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCampaigns = campaigns
    .filter(campaign => {
      const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'mostFunded') return b.raisedAmount - a.raisedAmount;
      if (sortBy === 'leastFunded') return a.raisedAmount - b.raisedAmount;
      if (sortBy === 'endingSoon') {
        const aDeadline = new Date(a.deadline);
        const bDeadline = new Date(b.deadline);
        return aDeadline - bDeadline;
      }
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">Browse Campaigns</h1>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-1/4 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
          />
          
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1); // Reset to first page when changing category
            }}
            className="w-full sm:w-1/4 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-1/4 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="mostFunded">Most Funded</option>
            <option value="leastFunded">Least Funded</option>
            <option value="endingSoon">Ending Soon</option>
          </select>

          <div className="w-full sm:w-1/4 flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => {
                  setShowCompleted(e.target.checked);
                  setPage(1); // Reset to first page when toggling completed campaigns
                }}
                className="form-checkbox h-5 w-5 text-indigo-600 transition duration-150 ease-in-out"
              />
              <span className="ml-2 text-gray-700">Show Only Completed Campaigns</span>
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6 text-center">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No campaigns found matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {filteredCampaigns.map((campaign) => {
                  const isFunded = campaign.raisedAmount >= campaign.goalAmount;
                  const progress = Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100);
                  const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24)));
                  
                  return (
                    <div key={campaign._id} className="group bg-white rounded-xl shadow-md hover:shadow-xl overflow-hidden transform transition-all duration-300 hover:-translate-y-2">
                      {campaign.mediaUrls?.[0] && (
                        <div className="relative overflow-hidden aspect-video">
                          <img
                            src={campaign.mediaUrls[0]}
                            alt={campaign.title}
                            className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                        </div>
                      )}
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 line-clamp-2 hover:text-indigo-600 transition-colors duration-200">
                            {campaign.title}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusBadgeClass(campaign.status, isFunded)}`}>
                              {isFunded ? 'Funded' : campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                            </span>
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-full whitespace-nowrap">
                              {campaign.category}
                            </span>
                          </div>
                        </div>
                        <p className="text-base text-gray-600 mb-4 line-clamp-2">
                          {campaign.description}
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-600">{campaign.creatorId.name?.[0] || 'U'}</span>
                            </div>
                            <span className="text-sm text-gray-600">{campaign.creatorId.name || 'Anonymous'}</span>
                          </div>
                          <Link
                            to={`/campaigns/${campaign._id}`}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                          >
                            View Details
                            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                      disabled={page === 1}
                      className={`relative inline-flex items-center px-4 py-2 rounded-l-md border text-sm font-medium
                        ${page === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      Previous
                    </button>
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
                    <button
                      onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={page === totalPages}
                      className={`relative inline-flex items-center px-4 py-2 rounded-r-md border text-sm font-medium
                        ${page === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Campaigns; 