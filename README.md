# Meta Campaign Automation Platform

A complete automation platform for Facebook and Instagram advertising campaigns.

## Features

- **Client Questionnaire**: Comprehensive business and campaign goal intake
- **Meta API Integration**: Automated campaign, ad set, and ad creation
- **Automation Engine**: Smart campaign structure generation and optimization
- **Real-time Dashboard**: Live metrics, performance tracking, and alerts
- **Auto-optimization**: Automatic pause/scale based on performance
- **A/B Testing**: Built-in split testing capabilities
- **AI Recommendations**: Smart suggestions for campaign improvement

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS, Chart.js
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB
- **APIs**: Meta Marketing API (Facebook/Instagram)
- **Scheduling**: Node-cron for automated tasks

## Project Structure

```
/backend          - Node.js/Express API server
/frontend         - Next.js web application
/shared           - Shared types and utilities
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB instance
- Meta Developer Account with API credentials

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Configure your environment variables
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Configure your environment variables
npm run dev
```

## Environment Variables

### Backend (.env)

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/meta-automation
JWT_SECRET=your_jwt_secret
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_API_VERSION=v19.0
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## API Endpoints

### Questionnaire
- POST `/api/questionnaire` - Submit client questionnaire
- GET `/api/questionnaire/:id` - Get questionnaire data

### Campaigns
- POST `/api/campaigns` - Create automated campaign
- GET `/api/campaigns` - List all campaigns
- GET `/api/campaigns/:id` - Get campaign details
- PUT `/api/campaigns/:id` - Update campaign
- DELETE `/api/campaigns/:id` - Delete campaign

### Analytics
- GET `/api/analytics/:campaignId` - Get campaign metrics
- GET `/api/analytics/:campaignId/insights` - Get detailed insights

### Automation
- POST `/api/automation/optimize` - Trigger optimization
- GET `/api/automation/status` - Get automation status

## Features Detail

### 1. Client Questionnaire
- Business information collection
- Target audience definition
- Budget planning
- Campaign goal setting
- Creative asset management
- API credential setup

### 2. Meta API Integration
- Campaign creation and management
- Ad set configuration
- Ad creative upload
- Advanced targeting
- Pixel integration

### 3. Automation Engine
- Intelligent campaign structure
- Audience optimization
- Budget distribution
- Goal-based targeting

### 4. Monitoring Dashboard
- Real-time CTR, CPC, ROAS
- Conversion tracking
- Performance charts
- Custom alerts
- Auto-optimization triggers

## Deployment

### Production Build

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

### Docker Deployment

```bash
docker-compose up -d
```

## License

MIT

## Support

For issues and questions, please create an issue in the repository.
