#!/bin/bash

echo "=========================================="
echo "MatchingDonors Backend API Test Script"
echo "=========================================="
echo ""

API_URL="http://localhost:8080"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASS=0
FAIL=0

# Function to test API endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -e "${YELLOW}Testing:${NC} $description"
    echo "  → $method $API_URL$endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$API_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method -H "Content-Type: application/json" -d "$data" "$API_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "  ${GREEN}✓ PASS${NC} (HTTP $http_code)"
        echo "  Response: $(echo $body | head -c 100)..."
        PASS=$((PASS+1))
    else
        echo -e "  ${RED}✗ FAIL${NC} (HTTP $http_code)"
        echo "  Response: $body"
        FAIL=$((FAIL+1))
    fi
    echo ""
}

echo "=== Profile Matching API Tests ==="
echo ""

# Test 1: Get all profiles
test_endpoint "GET" "/api/matching/profiles" "Get all profiles"

# Test 2: Store a test profile
test_endpoint "POST" "/api/matching/store" "Store patient profile" '{
  "id": "test-patient-001",
  "name": "John Doe",
  "type": "patient",
  "description": "Patient seeking kidney transplant",
  "medicalInfo": "Blood type O+, age 45, kidney disease stage 4, non-smoker, Boston, MA",
  "preferences": "Looking for living donor, willing to travel within New England"
}'

test_endpoint "POST" "/api/matching/store" "Store patient profile" '{
  "id": "test-patient-002",
  "name": "Maria Garcia",
  "type": "patient",
  "description": "Liver transplant needed urgently",
  "medicalInfo": "Blood type A-, age 38, end-stage liver disease, non-smoker, New York NY",
  "preferences": "Seeking compatible donor, family available for support"
}'

test_endpoint "POST" "/api/matching/store" "Store patient profile" '{
  "id": "test-patient-003",
  "name": "Robert Chen",
  "type": "patient",
  "description": "Heart transplant candidate",
  "medicalInfo": "Blood type B+, age 52, congestive heart failure, healthy lifestyle, Chicago IL",
  "preferences": "Need urgent transplant, willing to relocate temporarily"
}'

test_endpoint "POST" "/api/matching/store" "Store patient profile" '{
  "id": "test-patient-004",
  "name": "Emily Johnson",
  "type": "patient",
  "description": "Young patient needing kidney donor",
  "medicalInfo": "Blood type AB+, age 28, polycystic kidney disease, excellent health otherwise, Seattle WA",
  "preferences": "Looking for young healthy donor, willing to cover travel expenses"
}'

test_endpoint "POST" "/api/matching/store" "Store patient profile" '{
  "id": "test-patient-005",
  "name": "David Martinez",
  "type": "patient",
  "description": "Lung transplant required",
  "medicalInfo": "Blood type O-, age 44, pulmonary fibrosis, non-smoker, Denver CO",
  "preferences": "Seeking donor match, family support available"
}'

test_endpoint "POST" "/api/matching/store" "Store patient profile" '{
  "id": "test-patient-006",
  "name": "Sarah Williams",
  "type": "patient",
  "description": "Pancreas and kidney transplant needed",
  "medicalInfo": "Blood type A+, age 35, Type 1 diabetes complications, Boston MA",
  "preferences": "Looking for dual organ donor or separate donors"
}'

# Store donor profile
test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "test-donor-001",
  "name": "Jane Smith",
  "type": "donor",
  "description": "Healthy kidney donor",
  "medicalInfo": "Blood type O+, age 32, excellent health, non-smoker, Cambridge MA",
  "preferences": "Willing to donate to compatible patient, can travel"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "test-donor-002",
  "name": "Michael Brown",
  "type": "donor",
  "description": "Living liver donor volunteer",
  "medicalInfo": "Blood type A-, age 29, perfect health, athletic lifestyle, New York NY",
  "preferences": "Altruistic donor, willing to help those in need"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "test-donor-003",
  "name": "Lisa Anderson",
  "type": "donor",
  "description": "Kidney donor seeking recipient",
  "medicalInfo": "Blood type B+, age 40, excellent physical condition, non-smoker, Chicago IL",
  "preferences": "Prefer to help patient in Midwest region"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "test-donor-004",
  "name": "James Wilson",
  "type": "donor",
  "description": "Universal kidney donor",
  "medicalInfo": "Blood type AB+, age 35, exceptional health, marathon runner, Seattle WA",
  "preferences": "Willing to donate to any compatible patient nationwide"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "test-donor-005",
  "name": "Amanda Lee",
  "type": "donor",
  "description": "Living liver donor",
  "medicalInfo": "Blood type O-, age 26, perfect health records, non-smoker, Denver CO",
  "preferences": "Want to help save a life, flexible with location"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "test-donor-006",
  "name": "Christopher Davis",
  "type": "donor",
  "description": "Altruistic kidney donor",
  "medicalInfo": "Blood type A+, age 42, healthy lifestyle, non-drinker non-smoker, Boston MA",
  "preferences": "Looking to help local patient, family history of kidney disease awareness"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "test-donor-007",
  "name": "Patricia Taylor",
  "type": "donor",
  "description": "Directed kidney donor",
  "medicalInfo": "Blood type B-, age 31, excellent health, yoga instructor, Portland OR",
  "preferences": "Willing to travel anywhere in US, prefer younger recipients"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "test-donor-008",
  "name": "Steven Martinez",
  "type": "donor",
  "description": "Liver portion donor volunteer",
  "medicalInfo": "Blood type AB-, age 38, exceptional fitness, non-smoker, Miami FL",
  "preferences": "Can donate liver portion, seeking compatible patient"
}'

# Test 4: Find matches
test_endpoint "POST" "/api/matching/find" "Find matching profiles" '{
  "profileText": "Looking for kidney donor, blood type O+, healthy lifestyle",
  "topN": 5,
  "minSimilarity": 0.5
}'

echo ""
echo "=== Content Agent API Tests ==="
echo ""

# Test 5: Get articles
test_endpoint "GET" "/api/content/articles" "Get all articles"

# Test 6: Get statistics
test_endpoint "GET" "/api/content/statistics" "Get label statistics"

# Test 7: Get available sites
test_endpoint "GET" "/api/content/sites" "Get available crawler sites"

# Test 8: Filter articles (if articles exist)
test_endpoint "GET" "/api/content/articles/filter?topic=transplant" "Filter by topic"

echo ""
echo "=========================================="
echo "Test Results Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo "Total: $((PASS+FAIL))"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
#    exit 0
else
    echo -e "${RED}✗ Some tests failed. Check backend logs.${NC}"
    exit 1
fi

# 1. Crawl all sites (this will take 30-60 seconds)
curl -X POST http://localhost:8080/api/content/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "crawlAll": true,
    "maxArticles": 2
  }'

# 2. Label the crawled articles with Gemini AI
curl -X POST http://localhost:8080/api/content/label

# 3. Verify articles were labeled
curl http://localhost:8080/api/content/statistics

echo "=========================================="
echo "Populating News Hub with Articles"
echo "=========================================="
echo ""

API_URL="http://localhost:8080"

# Check if backend is running
echo "1. Checking backend connectivity..."
curl -s "$API_URL/api/content/sites" > /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Backend not running on port 8080"
    echo "   Start it with: cd matchingdonors-backend && npm run dev"
    exit 1
fi
echo "✅ Backend is running"
echo ""

# Clear existing articles
echo "2. Clearing old articles..."
curl -s -X DELETE "$API_URL/api/content/articles"
echo "✅ Cleared"
echo ""

# Crawl articles from all sites
echo "3. Crawling articles (this takes 30-60 seconds)..."
echo "   Fetching from 4 medical news sites..."
response=$(curl -s -X POST "$API_URL/api/content/crawl" \
  -H "Content-Type: application/json" \
  -d '{"crawlAll": true, "maxArticles": 3}')

article_count=$(echo $response | grep -o '"articlesCount":[0-9]*' | grep -o '[0-9]*')
echo "✅ Crawled $article_count articles"
echo ""

# Label articles with AI
echo "4. Labeling articles with Gemini AI..."
label_response=$(curl -s -X POST "$API_URL/api/content/label")
labeled_count=$(echo $label_response | grep -o '"labeled":[0-9]*' | grep -o '[0-9]*')
echo "✅ Labeled $labeled_count articles"
echo ""

# Get statistics
echo "5. Fetching statistics..."
stats=$(curl -s "$API_URL/api/content/statistics")
echo "$stats" | python3 -m json.tool 2>/dev/null || echo "$stats"
echo ""

echo "=========================================="
echo "✅ News Hub Ready!"
echo "=========================================="
echo ""
echo "Refresh your News Hub page: http://localhost:3000/news-hub"
echo ""

