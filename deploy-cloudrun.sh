#!/bin/bash

# Set your project ID
PROJECT_ID="your-project-id"

# Build and deploy to Cloud Run
echo "Building and deploying to Cloud Run..."
gcloud builds submit --config cloudbuild.yaml --substitutions=_JWT_SECRET="your-jwt-secret",_POSTGRES_HOST="your-postgres-host",_POSTGRES_PORT="5432",_POSTGRES_USER="your-postgres-user",_POSTGRES_PASSWORD="your-postgres-password",_POSTGRES_DB="chinese_vocab"

echo "Backend deployed to Cloud Run!" 