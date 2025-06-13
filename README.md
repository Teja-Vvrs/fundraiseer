# Fundraiseer - Modern Fundraising Platform

A full-stack fundraising platform built with React, Node.js, and MongoDB that enables users to create and manage fundraising campaigns, accept donations, and track progress.

## Features

### For Users
- 🚀 Create and manage fundraising campaigns
- 💰 fake donation processing for demo
- 📊 Real-time campaign statistics and progress tracking
- 📱 Responsive design for all devices
- 💬 Campaign comments and updates

### For Campaign Creators
- 📈 Detailed campaign analytics dashboard
- 💸 Track donations and donor information
- 🎯 Set fundraising goals and deadlines
- 📝 Update campaign details and status
- 🏷️ Categorize campaigns for better visibility

### For Donors
- 🔒 Demo payment processing
- 📱 Easy-to-use donation interface
- 👥 Option for anonymous donations
- 💖 Track donation history

## Tech Stack

### Frontend
- React.js with Hooks
- TailwindCSS for styling
- Framer Motion for animations
- Recharts for data visualization
- Axios for API requests
- React Router for navigation

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/fundraiseer.git
cd fundraiseer
```

2. Install dependencies for both frontend and backend
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

3. Set up environment variables
```bash
# In server directory, create .env file
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
NODE_ENV=development

# In client directory, create .env file
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development servers
```bash
# Start backend server (from server directory)
npm run dev

# Start frontend server (from client directory)
npm start
```

## Project Structure

```
fundraiseer/
├── client/                 # Frontend React application
│   ├── public/            # Static files
│   └── src/
│       ├── components/    # Reusable components
│       ├── context/       # React context providers
│       ├── pages/         # Page components
│       ├── services/      # API services
│       └── utils/         # Utility functions
│
└── server/                # Backend Node.js application
    ├── controllers/       # Route controllers
    ├── middleware/        # Custom middleware
    ├── models/           # Mongoose models
    ├── routes/           # API routes
    └── utils/            # Utility functions
```

## API Documentation

### Authentication Endpoints
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login
- GET `/api/auth/me` - Get current user

### Campaign Endpoints
- GET `/api/campaigns` - List all campaigns
- POST `/api/campaigns` - Create new campaign
- GET `/api/campaigns/:id` - Get campaign details
- PUT `/api/campaigns/:id` - Update campaign
- POST `/api/campaigns/:id/donate` - Make donation

### User Dashboard Endpoints
- GET `/api/dashboard/user` - Get user dashboard data
- GET `/api/dashboard/donations` - Get user donation history
- GET `/api/dashboard/campaigns/:id/stats` - Get campaign statistics

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
