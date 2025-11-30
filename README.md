# InfraMind - Self-Healing Cloud & API Reliability Copilot

InfraMind is an intelligent infrastructure monitoring and reliability platform that provides AI-powered insights, automated health checks, and self-healing recommendations for your cloud services and APIs.

## Features

### Core Capabilities
- **Intelligent Health Monitoring**: Automated burst testing and latency analysis
- **AI-Powered Reports**: Comprehensive reliability assessments with risk analysis
- **Infrastructure Automation**: Auto-generated NGINX, Docker, and Kubernetes configurations
- **Real-time Dashboards**: Beautiful, responsive monitoring interfaces
- **Predictive Analytics**: Early warning system for potential outages

### Technical Features
- **Multi-Environment Support**: Development, Staging, and Production environments
- **Scalable Architecture**: Built with MongoDB, Redis, and Bull queues
- **RESTful API**: Complete backend API for integration
- **Modern Frontend**: React + TypeScript + Tailwind CSS
- **Real-time Updates**: Live health check status and notifications

## Architecture

### Backend Stack
- **Node.js + Express**: RESTful API server
- **MongoDB**: Primary database with Mongoose ODM
- **Redis**: Caching and job queue management
- **Bull Queue**: Background job processing
- **TypeScript**: Type-safe development

### Frontend Stack
- **React 18**: Modern UI framework
- **TypeScript**: Type safety and better DX
- **Tailwind CSS**: Utility-first styling
- **React Router**: Client-side routing
- **Axios**: HTTP client for API calls

### Infrastructure
- **Docker Compose**: Local development environment
- **Vite**: Fast development and build tool
- **ESLint + Prettier**: Code quality and formatting

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for databases)

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd infra-mind
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure it:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Server Configuration
NODE_ENV=development
PORT=3001
CLIENT_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://admin:password123@localhost:27017/inframind?authSource=admin

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRATION=7d

# Health Check Configuration
DEFAULT_HEALTH_CHECK_INTERVAL=300000
DEFAULT_TIMEOUT_MS=10000
DEFAULT_BURST_SIZE=20

# Optional: AI Service Configuration (for future LLM integration)
# OPENAI_API_KEY=your_openai_api_key_here
# CLAUDE_API_KEY=your_claude_api_key_here
```

### 4. Start Infrastructure Services

Start MongoDB and Redis using Docker Compose:
```bash
npm run docker:up
```

Alternatively, if you have Docker Compose installed separately:
```bash
docker-compose up -d
```

### 5. Run the Application

Start both backend and frontend concurrently:
```bash
npm run dev
```

This command will:
- Start the backend API server on port 3001
- Start the background worker for health checks
- Start the frontend development server on port 3000

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### Individual Commands

If you prefer to run services separately:
```bash
# Start only backend (includes worker)
npm run dev:backend

# Start only frontend
npm run dev:frontend

# Stop Docker services
npm run docker:down
```

## Project Structure
```
infra-mind/
├── backend/
│   ├── config/              # Configuration files (database, redis)
│   ├── middleware/          # Express middleware (error handling, async)
│   ├── models/              # MongoDB schemas (Service, HealthRun, PredictionReport)
│   ├── routes/              # Express routes (services, health-runs, reports)
│   ├── services/            # Business logic (health checks, AI reports)
│   ├── workers/             # Background workers (Bull queue processors)
│   └── server.ts            # Main server entry point
├── src/
│   ├── components/          # React components (Layout, Navigation, UI)
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   ├── pages/               # Page components (Dashboard, Services, Reports)
│   ├── services/            # API client services
│   ├── styles/              # Global styles
│   └── App.tsx              # Main React application
├── docker-compose.yml       # Docker services configuration
├── package.json             # Project dependencies and scripts
├── vite.config.ts           # Vite configuration
└── tsconfig.json            # TypeScript configuration
```

## Usage Guide

### Adding a Service

1. Navigate to the Services page
2. Click "Add Service"
3. Fill in the service details:
   - **Name**: Friendly name for your service
   - **Base URL**: The root URL of your service
   - **Health Check Path**: Endpoint for health checks (e.g., /health)
   - **Expected Latency**: Min and max acceptable response times
   - **Environment**: dev, staging, or prod

### Running Health Checks

1. Go to the Services page
2. Click the "Play" button on any service card
3. The system will:
   - Execute burst testing with configurable request count
   - Measure latency, success rate, and error patterns
   - Generate comprehensive metrics
   - Create an AI-powered reliability report

### Viewing Reports

1. Navigate to the Reports page
2. Filter by risk level or service
3. Click on any report to view:
   - Executive summary
   - Risk assessment (Low, Medium, High)
   - Timeline of events
   - Warnings and issues detected
   - Actionable recommendations
   - Auto-generated infrastructure configurations

### Understanding Reports

Each report includes:

**Risk Levels**:
- **Low**: Service is healthy and performing within expected parameters
- **Medium**: Some issues detected that require attention
- **High**: Critical issues that need immediate action

**Generated Configurations**:
- **NGINX**: Rate limiting and proxy configuration
- **Docker**: Resource limits and health check configuration
- **Kubernetes**: Deployment specs with probes and resource requests

## API Documentation

### Services API

**Create Service**
```http
POST /api/services
Content-Type: application/json

{
  "name": "My API Service",
  "baseUrl": "https://api.example.com",
  "healthPath": "/health",
  "expectedLatencyMinMs": 100,
  "expectedLatencyMaxMs": 1000,
  "env": "prod"
}
```

**Get All Services**
```http
GET /api/services?env=prod&page=1&limit=10
```

**Run Health Check**
```http
POST /api/services/:id/run-health-check
```

### Health Runs API

**Get All Health Runs**
```http
GET /api/health-runs?serviceId=xxx&status=healthy
```

**Get Health Run Details**
```http
GET /api/health-runs/:id
```

### Reports API

**Get All Reports**
```http
GET /api/reports?riskLevel=high&serviceId=xxx
```

**Get Report Details**
```http
GET /api/reports/:id
```

**Get Shareable Report**
```http
GET /api/reports/:serviceId/:runId
```

## Configuration

### Health Check Settings

Adjust health check behavior via environment variables:

- `DEFAULT_TIMEOUT_MS`: Maximum time to wait for health check response (default: 10000)
- `DEFAULT_BURST_SIZE`: Number of concurrent requests for load testing (default: 20)
- `DEFAULT_HEALTH_CHECK_INTERVAL`: Automatic check interval in milliseconds (default: 300000)

### Database Configuration

MongoDB connection string format:
```
mongodb://[username]:[password]@[host]:[port]/[database]?authSource=admin
```

Redis connection string format:
```
redis://[host]:[port]
```

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Code Quality

The project uses ESLint and Prettier for code quality:
```bash
npm run lint
npm run format
```

## Troubleshooting

### MongoDB Connection Issues

If you see MongoDB connection errors:

1. Verify Docker containers are running: `docker ps`
2. Check MongoDB logs: `docker logs infra-mind-mongo`
3. Ensure credentials match those in `.env` and `docker-compose.yml`

### Redis Connection Issues

If Redis connection fails:

1. Check Redis container: `docker logs infra-mind-redis`
2. Verify Redis URL in `.env` matches Docker configuration
3. Test connection: `redis-cli -h localhost -p 6379 ping`

### Worker Not Processing Jobs

If health checks remain in "running" state:

1. Check server logs for worker startup message
2. Verify Redis connection is established
3. Restart the backend server: `npm run dev:backend`

### Port Conflicts

If ports 3000 or 3001 are already in use:

1. Change `PORT` in `.env` for backend
2. Update `vite.config.ts` port for frontend
3. Update `CLIENT_URL` in `.env` to match new frontend port

## Security Notes

- Never commit `.env` files or API keys to version control
- Change default passwords in production environments
- Use strong JWT secrets in production
- Enable HTTPS in production deployments
- Implement authentication before exposing to public networks
- Review and adjust rate limiting settings for your use case

## Production Deployment

### Environment Variables

Ensure these are properly set in production:
```env
NODE_ENV=production
PORT=3001
CLIENT_URL=https://your-frontend-domain.com
MONGODB_URI=mongodb://production-connection-string
REDIS_URL=redis://production-redis-url
JWT_SECRET=strong-random-secret-key
```

### Build and Deploy
```bash
# Build frontend
npm run build

# Start production server
npm start
```

### Docker Deployment

Use the provided `docker-compose.yml` as a starting point and adjust for production:

- Use production-ready MongoDB and Redis images
- Configure persistent volumes for data
- Set up proper networking and security groups
- Enable authentication on MongoDB and Redis
- Use environment-specific configuration files

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

MIT License

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.
