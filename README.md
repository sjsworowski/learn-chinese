# Learn Chinese - Full Stack App

## Overview
A full-stack Chinese vocabulary learning app with:
- **Frontend:** React (Vite, TypeScript)
- **Backend:** NestJS (TypeScript, TypeORM)
- **Database:** PostgreSQL
- **Authentication:** Email and password
- **Containerized:** Docker & Docker Compose

---

## Features
- **Authentication:** Email and password (register / sign in)
- **Vocabulary Study:** Interactive flashcards and learning sessions
- **Progress Tracking:** Detailed statistics and learning progress
- **Testing System:** Multiple test types (vocabulary, pinyin)
- **Text-to-Speech:** Audio pronunciation (Google Cloud TTS)
- **Health Check:** Monitoring endpoint for production deployment
- **Ready for CI/CD:** Production deployment ready

---

## Getting Started (Development)

### Prerequisites
- [Docker](https://www.docker.com/get-started)
- [Node.js](https://nodejs.org/) (for local dev, optional)
- (Optional) Gmail account for reminder emails

### 1. Clone the Repository
```sh
git clone <your-repo-url>
cd Learn Chinese
```

### 2. Set Up Environment Variables
Create a `.env` file in the project root:
```env
# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=postgres

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email (optional, for reminder emails only)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000

# API URL for frontend
VITE_API_URL=http://localhost:3001

# PgAdmin Configuration
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=admin

# Google Cloud Text-to-Speech (optional)
# GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json

# Environment
NODE_ENV=development
```

### 3. Run the Full Stack with Docker Compose
```sh
docker-compose up --build
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:3001](http://localhost:3001)
- pgAdmin: [http://localhost:5050](http://localhost:5050)

---

## Authentication Flow

### Email & Password
1. **Register:** Create an account with email, password, and optional username
2. **Sign in:** Use email and password on the login page
3. **Session:** JWT tokens with optional "Remember me" (longer expiry)

### Security
- Passwords hashed with bcrypt
- JWT for session management
- Existing users who had no password (legacy) can register again with the same email to set a password

---

## Health Check
- The backend exposes a health check at `/api/health` (e.g., [http://localhost:3001/api/health](http://localhost:3001/api/health))
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

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register (email, password, optional username)
- `POST /api/auth/login` - Sign in (email, password, optional rememberMe)
- `GET /api/auth/me` - Get current user profile

### Vocabulary
- `GET /api/vocabulary` - Get vocabulary list
- `POST /api/vocabulary/:id/learn` - Mark word as learned
- `POST /api/vocabulary/reset` - Reset learning progress

### Statistics
- `GET /api/stats` - Get user statistics
- `POST /api/stats/session` - Save session data
- `POST /api/stats/test-completed` - Record test completion

### Text-to-Speech
- `POST /api/tts` - Generate audio pronunciation

---

## Development

### Running Locally (without Docker)
```sh
# Backend
cd backend
npm install
npm run start:dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

### Database Seeding
The app automatically seeds the database with:
- Demo user: (test@example.com)
- Chinese vocabulary from vocab.json
- User progress tracking

---

## CI/CD (GitHub Actions Example)
- Build, test, and deploy with GitHub Actions.
- See `.github/workflows/ci-cd.yml` for a sample workflow.

---

## Deployment Notes
- Use strong, unique secrets in production.
- Set up HTTPS/SSL (via reverse proxy or cloud load balancer).
- Restrict backend CORS to your frontend's production domain.
- Ensure Postgres data is stored in a Docker volume or managed DB.
- Configure EMAIL_USER/EMAIL_PASSWORD for reminder emails if desired.
- For **daily reminder emails in cloud**: see "Reminder emails in cloud" below.
- Add monitoring/logging as needed.

---

## Troubleshooting

### Reminder emails in cloud
Daily reminder emails are sent by an in-process cron (8pm UTC). **On cloud, the app is often asleep or serverless**, so the cron may never run. To fix:
1. Set **CRON_SECRET** in your backend environment (e.g. a random string).
2. Use an external scheduler (e.g. [cron-job.org](https://cron-job.org)) to call once per day:
   - **URL:** `POST https://your-backend-url/api/email-reminders/cron/daily`
   - **Header:** `X-Cron-Secret: <your CRON_SECRET>`
3. Ensure **EMAIL_USER** and **EMAIL_PASSWORD** are set in the cloud environment so the backend can send mail.

### Auth / login
- **Invalid email or password:** Ensure the user has registered; existing users without a password can sign up again with the same email to set one.
- **Authentication errors:** Ensure JWT_SECRET is consistent across restarts.

### General Issues
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
- **Authentication**: Email/password (no external service needed)
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

---

## License
MIT 