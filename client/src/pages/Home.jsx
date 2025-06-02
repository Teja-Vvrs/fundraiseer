import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { campaignAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  SparklesIcon, 
  GlobeAmericasIcon,
  HeartIcon,
  UserGroupIcon 
} from '@heroicons/react/24/outline';

const Home = () => {
  const [featuredCampaigns, setFeaturedCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchFeaturedCampaigns = async () => {
      try {
        console.log('Fetching campaigns that need donations...');
        // Get approved campaigns that haven't reached their goal yet
        const response = await campaignAPI.getAllCampaigns({ 
          limit: 3,
          status: 'approved',
          needsFunding: true,
          sort: 'urgency'
        });
        console.log('Featured campaigns response:', response);
        setFeaturedCampaigns(response.data.campaigns);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Failed to load campaigns that need donations';
        setError(`Error: ${errorMessage}`);
        
        // Log detailed error information
        if (error.response) {
          console.error('Error response:', {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers
          });
        } else if (error.request) {
          console.error('Error request:', error.request);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedCampaigns();
  }, []);

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700"></div>
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
        
        {/* Animated Circles */}
        <motion.div 
          className="absolute top-20 right-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <motion.h1 
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 sm:mb-8 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                Make a Difference <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400">
                  One Donation at a Time
                </span>
              </motion.h1>
              <motion.p 
                className="text-xl sm:text-2xl text-white/90 mb-8 sm:mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                Join our community of changemakers and create lasting impact through meaningful donations.
              </motion.p>
              <motion.div 
                className="flex flex-col sm:flex-row justify-center lg:justify-start items-center space-y-4 sm:space-y-0 sm:space-x-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <Link
                  to="/campaigns"
                  className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500/80 to-purple-500/80 backdrop-blur-sm border border-white/10 shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative text-lg font-semibold text-white flex items-center">
                    Browse Campaigns
                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </Link>
                <Link
                  to={user ? "/create-campaign" : "/register"}
                  className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg hover:shadow-orange-500/25 transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  <span className="relative text-lg font-semibold flex items-center">
                    {user ? "Start a Campaign" : "Get Started Now"}
                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
              </motion.div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-2 gap-6"
            >
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="col-span-1 p-6 rounded-2xl bg-gradient-to-br from-purple-500/30 to-purple-600/30 backdrop-blur-md border border-purple-500/30 shadow-lg hover:shadow-purple-500/20"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-purple-500 shadow-lg shadow-purple-500/30">
                    <HeartIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white">10K+</h3>
                    <p className="text-purple-200">Donors</p>
                  </div>
                </div>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="col-span-1 p-6 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-indigo-600/30 backdrop-blur-md border border-indigo-500/30 shadow-lg hover:shadow-indigo-500/20"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-indigo-500 shadow-lg shadow-indigo-500/30">
                    <GlobeAmericasIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white">50+</h3>
                    <p className="text-indigo-200">Countries</p>
                  </div>
                </div>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="col-span-1 p-6 rounded-2xl bg-gradient-to-br from-yellow-500/30 to-amber-600/30 backdrop-blur-md border border-yellow-500/30 shadow-lg hover:shadow-yellow-500/20"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-yellow-500 shadow-lg shadow-yellow-500/30">
                    <SparklesIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white">$2M+</h3>
                    <p className="text-yellow-200">Raised</p>
                  </div>
                </div>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="col-span-1 p-6 rounded-2xl bg-gradient-to-br from-orange-500/30 to-red-600/30 backdrop-blur-md border border-orange-500/30 shadow-lg hover:shadow-orange-500/20"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-orange-500 shadow-lg shadow-orange-500/30">
                    <UserGroupIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white">1K+</h3>
                    <p className="text-orange-200">Campaigns</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Campaigns Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Featured Campaigns</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover and support these amazing campaigns that are making a difference in our community
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : featuredCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCampaigns.map((campaign) => {
              const progress = Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100);
              const daysLeft = Math.ceil((new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24));
              
              return (
                <Link
                  to={`/campaigns/${campaign._id}`}
                  key={campaign._id}
                  className="group bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                >
                  {campaign.mediaUrls?.[0] && (
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={campaign.mediaUrls[0]}
                        alt={campaign.title}
                        className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-1 text-xs font-semibold text-white bg-black/30 backdrop-blur-sm rounded-full">
                            {campaign.category}
                          </span>
                          <span className="px-2 py-1 text-xs font-semibold text-white bg-black/30 backdrop-blur-sm rounded-full">
                            {daysLeft} days left
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors duration-200">
                      {campaign.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {campaign.description}
                    </p>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Progress</span>
                        <span className="font-semibold">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${progress}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 rounded-full animate-shimmer"></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          ${campaign.raisedAmount.toLocaleString()} raised
                        </span>
                        <span className="font-semibold text-indigo-600">
                          ${campaign.goalAmount.toLocaleString()} goal
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">😕</div>
            <p className="text-lg text-gray-600">No featured campaigns at the moment.</p>
            <Link
              to="/create-campaign"
              className="inline-block mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Create a Campaign →
            </Link>
          </div>
        )}
      </section>

      {/* Call to Action Section */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-indigo-50 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join our community of changemakers and start your fundraising journey today.
          </p>
          <Link
            to={user ? "/create-campaign" : "/register"}
            className="inline-flex items-center px-8 py-3 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            {user ? "Start a Campaign" : "Get Started Now"}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home; 