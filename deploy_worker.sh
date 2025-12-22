#!/bin/bash
set -e

# Configuration
SERVICE_NAME="n0n4-worker"
REGION="us-central1" # You can change this
PROJECT_ID=$(gcloud config get-value project)

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Deployment for $SERVICE_NAME...${NC}"

# 0. Check Project ID
if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}❌ Error: Could not determine Google Cloud Project ID.${NC}"
  echo "Please run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi
echo -e "Target Project: ${GREEN}$PROJECT_ID${NC}"

# 1. Load Environment Variables
echo -e "Loading .env.local..."
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
else
  echo -e "${RED}❌ Error: .env.local not found!${NC}"
  exit 1
fi

# 2. Deploy to Cloud Run (Build + Deploy)
echo -e "${GREEN}☁️  Building and Deploying to Cloud Run...${NC}"

# Using --source automatically builds using Cloud Build and pushes to Artifact Registry
# This avoids GCR vs AR issues and manages the image for us.
gcloud run deploy $SERVICE_NAME \
  --source backend \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 1 \
  --set-env-vars NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --set-env-vars SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --set-env-vars R2_ACCOUNT_ID="$R2_ACCOUNT_ID" \
  --set-env-vars R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
  --set-env-vars R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
  --set-env-vars R2_BUCKET_NAME="$R2_BUCKET_NAME"

echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "Check the logs in Cloud Console to confirm the worker is running."
