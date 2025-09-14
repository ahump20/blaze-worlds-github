#!/bin/bash

#############################################
# Blaze Intelligence Vision Engine
# Championship Deployment Script
# Deploy all Cloud Functions and infrastructure
#############################################

set -e

echo "🏆 BLAZE INTELLIGENCE VISION ENGINE - CHAMPIONSHIP DEPLOYMENT"
echo "============================================================"

# Configuration
PROJECT_ID="blaze-intelligence-prod"
REGION="us-central1"
BUCKET_NAME="blaze-vision-processing"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed. Please install it first.${NC}"
        exit 1
    fi
}

# Function to print status
print_status() {
    echo -e "${YELLOW}🔄 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
print_status "Checking prerequisites..."
check_command gcloud
check_command npm

# Set project
print_status "Setting GCP project to ${PROJECT_ID}..."
gcloud config set project ${PROJECT_ID}

# Enable required APIs
print_status "Enabling required Google Cloud APIs..."
gcloud services enable \
    cloudfunctions.googleapis.com \
    cloudscheduler.googleapis.com \
    pubsub.googleapis.com \
    firestore.googleapis.com \
    storage.googleapis.com \
    cloudresourcemanager.googleapis.com \
    vision.googleapis.com \
    videointelligence.googleapis.com

print_success "APIs enabled successfully"

# Create Cloud Storage bucket for processing
print_status "Creating Cloud Storage bucket for video processing..."
gsutil mb -p ${PROJECT_ID} -c STANDARD -l ${REGION} gs://${BUCKET_NAME}/ || true
gsutil lifecycle set lifecycle.json gs://${BUCKET_NAME}/
print_success "Storage bucket configured"

# Create Pub/Sub topics
print_status "Creating Pub/Sub topics..."
gcloud pubsub topics create vision-engine-biomechanics --project=${PROJECT_ID} || true
gcloud pubsub topics create vision-engine-behavioral --project=${PROJECT_ID} || true
gcloud pubsub topics create vision-engine-synthesis --project=${PROJECT_ID} || true
gcloud pubsub topics create vision-engine-complete --project=${PROJECT_ID} || true
print_success "Pub/Sub topics created"

# Deploy Video Ingestion Function
print_status "Deploying Video Ingestion Function..."
cd functions/video-ingestion
npm install
gcloud functions deploy videoIngestion \
    --runtime nodejs18 \
    --trigger-http \
    --allow-unauthenticated \
    --memory 512MB \
    --timeout 120s \
    --region ${REGION} \
    --set-env-vars "GCS_PROCESSING_BUCKET=${BUCKET_NAME},CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME},CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY},CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET},CLOUDINARY_WEBHOOK_SECRET=${CLOUDINARY_WEBHOOK_SECRET}"

INGESTION_URL=$(gcloud functions describe videoIngestion --region ${REGION} --format="value(httpsTrigger.url)")
print_success "Video Ingestion deployed at: ${INGESTION_URL}"
cd ../..

# Deploy Biomechanics Analysis Function
print_status "Deploying Biomechanics Analysis Function..."
cd functions/biomechanics-analysis
npm install
gcloud functions deploy biomechanicsAnalysis \
    --runtime nodejs18 \
    --trigger-topic vision-engine-biomechanics \
    --memory 2GB \
    --timeout 540s \
    --region ${REGION} \
    --set-env-vars "GCS_PROCESSING_BUCKET=${BUCKET_NAME}"

print_success "Biomechanics Analysis deployed"
cd ../..

# Deploy Behavioral Analysis Function
print_status "Deploying Behavioral Analysis Function..."
cd functions/behavioral-analysis
npm install
gcloud functions deploy behavioralAnalysis \
    --runtime nodejs18 \
    --trigger-topic vision-engine-behavioral \
    --memory 2GB \
    --timeout 540s \
    --region ${REGION} \
    --set-env-vars "GCS_PROCESSING_BUCKET=${BUCKET_NAME}"

print_success "Behavioral Analysis deployed"
cd ../..

# Deploy Synthesis Function
print_status "Deploying Synthesis Function..."
cd functions/synthesis
npm install
gcloud functions deploy synthesisEngine \
    --runtime nodejs18 \
    --trigger-topic vision-engine-synthesis \
    --memory 2GB \
    --timeout 540s \
    --region ${REGION}

print_success "Synthesis Engine deployed"
cd ../..

# Create Firestore indexes
print_status "Creating Firestore indexes..."
gcloud firestore indexes create --collection-group=analysis_sessions --field-config field-path=createdAt,order=DESCENDING --field-config field-path=playerId,order=ASCENDING
gcloud firestore indexes create --collection-group=biomechanics --field-config field-path=startFrame,order=ASCENDING
gcloud firestore indexes create --collection-group=behavioral --field-config field-path=startFrame,order=ASCENDING
print_success "Firestore indexes created"

# Set up Cloudinary webhook
print_status "Configuring Cloudinary webhook..."
echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo "Configure Cloudinary webhook to point to:"
echo "${INGESTION_URL}"
echo ""

# Deploy monitoring dashboard
print_status "Setting up monitoring dashboard..."
gcloud monitoring dashboards create --config-from-file=monitoring-dashboard.json || true
print_success "Monitoring dashboard configured"

# Final summary
echo ""
echo "============================================================"
echo -e "${GREEN}🏆 CHAMPIONSHIP DEPLOYMENT COMPLETE!${NC}"
echo "============================================================"
echo ""
echo "Vision Engine Components:"
echo "  • Video Ingestion: ${INGESTION_URL}"
echo "  • Biomechanics Analysis: PubSub triggered"
echo "  • Behavioral Analysis: PubSub triggered"
echo "  • Synthesis Engine: PubSub triggered"
echo ""
echo "Resources Created:"
echo "  • Storage Bucket: gs://${BUCKET_NAME}"
echo "  • PubSub Topics: 4 topics created"
echo "  • Firestore Collections: Ready for data"
echo ""
echo "Next Steps:"
echo "  1. Configure Cloudinary webhook to ${INGESTION_URL}"
echo "  2. Test with sample video upload"
echo "  3. Monitor logs: gcloud functions logs read --limit 50"
echo ""
echo "Championship ready. Time to revolutionize sports intelligence."
echo "============================================================"