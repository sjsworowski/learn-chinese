# Learn Chinese - Full Stack App

## Overview
A full-stack Chinese vocabulary learning app with:
- **Frontend:** React (Vite, TypeScript)
- **Backend:** NestJS (TypeScript, TypeORM)
- **Database:** PostgreSQL
- **Containerized:** Docker & Docker Compose

---

## Features
- User authentication (JWT)
- Vocabulary study and testing
- Progress tracking and stats
- Health check endpoint for monitoring
- Ready for CI/CD and production deployment

---

## Getting Started (Development)

### Prerequisites
- [Docker](https://www.docker.com/get-started)
- [Node.js](https://nodejs.org/) (for local dev, optional)

### 1. Clone the Repository
```sh
git clone <your-repo-url>
cd Learn Chinese
```

### 2. Set Up Environment Variables
Create a `.env` file in the project root:
```env
# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=chinese_vocab

# Frontend
VITE_API_URL=http://backend:3001/api

# pgAdmin
PGADMIN_DEFAULT_EMAIL=admin@admin.com
PGADMIN_DEFAULT_PASSWORD=admin123

# Backend JWT
JWT_SECRET=your-very-secret-key
```

**Note:** Never commit your real secrets to version control!

### 3. Run the Full Stack with Docker Compose
```sh
docker-compose up --build
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:3001](http://localhost:3001)
- pgAdmin: [http://localhost:5050](http://localhost:5050)

---

## Health Check
- The backend exposes a health check at `/health` (e.g., [http://localhost:3001/health](http://localhost:3001/health))
- Docker Compose uses this for automatic health monitoring.

---

## Database Migrations
- Use TypeORM migrations for schema changes.
- Run migrations in the backend container:
```sh
docker-compose exec backend npm run migration:run
```
- Never use `synchronize: true` in production.

---

## CI/CD (GitHub Actions Example)
- Build, test, and deploy with GitHub Actions.
- See `.github/workflows/ci-cd.yml` for a sample workflow.

---

## Deployment Notes
- Use strong, unique secrets in production.
- Set up HTTPS/SSL (via reverse proxy or cloud load balancer).
- Restrict backend CORS to your frontend’s production domain.
- Ensure Postgres data is stored in a Docker volume or managed DB.
- Add monitoring/logging as needed.

---

## Troubleshooting
- If containers fail to start, check your `.env` values and logs.
- For local dev, you can run frontend and backend separately with hot reload.
- For production, always use Docker Compose or a similar orchestrator.

---

## Firebase + Cloud Run Deployment

### Quick Setup
1. **Create a Google Cloud Project** at https://console.cloud.google.com/
2. **Enable Firebase** in your project
3. **Install Firebase CLI**: `npm install -g firebase-tools`
4. **Login to Firebase**: `firebase login`
5. **Initialize Firebase**: `firebase init`
6. **Deploy frontend**: `./deploy-firebase.sh`
7. **Deploy backend**: `./deploy-cloudrun.sh`

### Firebase + Cloud Run Configuration
- **Frontend**: Firebase Hosting (free tier)
- **Backend**: Cloud Run (free tier)
- **Database**: Firestore or Cloud SQL (free tier)
- **Authentication**: Firebase Auth (free tier)
- **SSL certificates**: Automatically provided
- **Custom domains**: Supported

### Environment Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (select Hosting)
firebase init

# Set up Google Cloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```



## License
MIT 