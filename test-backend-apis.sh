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
  "bloodType": "O+",
  "age": 45,
  "country": "USA",
  "state": "Massachusetts",
  "city": "Boston",
  "organType": "Kidney",
  "description": "Patient seeking kidney transplant",
  "medicalInfo": "Blood type O+, age 45, kidney disease stage 4, non-smoker, Boston, MA",
  "preferences": "Looking for living donor, willing to travel within New England"
}'

test_endpoint "POST" "/api/matching/store" "Store patient profile" '{
  "id": "test-patient-002",
  "name": "Maria Garcia",
  "type": "patient",
  "bloodType": "A-",
  "age": 38,
  "country": "USA",
  "state": "New York",
  "city": "New York",
  "organType": "Liver",
  "description": "Liver transplant needed urgently",
  "medicalInfo": "Blood type A-, age 38, end-stage liver disease, non-smoker, New York NY",
  "preferences": "Seeking compatible donor, family available for support"
}'

test_endpoint "POST" "/api/matching/store" "Store patient profile" '{
  "id": "test-patient-003",
  "name": "Robert Chen",
  "type": "patient",
  "bloodType": "B+",
  "age": 52,
  "country": "USA",
  "state": "Illinois",
  "city": "Chicago",
  "organType": "Heart",
  "description": "Heart transplant candidate",
  "medicalInfo": "Blood type B+, age 52, congestive heart failure, healthy lifestyle, Chicago IL",
  "preferences": "Need urgent transplant, willing to relocate temporarily"
}'

test_endpoint "POST" "/api/matching/store" "Store patient profile" '{
  "id": "test-patient-004",
  "name": "Emily Johnson",
  "type": "patient",
  "bloodType": "AB+",
  "age": 28,
  "country": "USA",
  "state": "Washington",
  "city": "Seattle",
  "organType": "Kidney",
  "description": "Young patient needing kidney donor",
  "medicalInfo": "Blood type AB+, age 28, polycystic kidney disease, excellent health otherwise, Seattle WA",
  "preferences": "Looking for young healthy donor, willing to cover travel expenses"
}'

test_endpoint "POST" "/api/matching/store" "Store patient profile" '{
  "id": "test-patient-005",
  "name": "David Martinez",
  "type": "patient",
  "bloodType": "O-",
  "age": 44,
  "country": "USA",
  "state": "Colorado",
  "city": "Denver",
  "organType": "Lung",
  "description": "Lung transplant required",
  "medicalInfo": "Blood type O-, age 44, pulmonary fibrosis, non-smoker, Denver CO",
  "preferences": "Seeking donor match, family support available"
}'

test_endpoint "POST" "/api/matching/store" "Store patient profile" '{
  "id": "test-patient-006",
  "name": "Sarah Williams",
  "type": "patient",
  "bloodType": "A+",
  "age": 35,
  "country": "USA",
  "state": "Massachusetts",
  "city": "Boston",
  "organType": "Pancreas",
  "description": "Pancreas and kidney transplant needed",
  "medicalInfo": "Blood type A+, age 35, Type 1 diabetes complications, Boston MA",
  "preferences": "Looking for dual organ donor or separate donors"
}'

# Store donor profile
test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "test-donor-001",
  "name": "Jane Smith",
  "type": "donor",
  "bloodType": "O+",
  "age": 32,
  "country": "USA",
  "state": "Massachusetts",
  "city": "Cambridge",
  "organType": "Kidney",
  "description": "Healthy kidney donor",
  "medicalInfo": "Blood type O+, age 32, excellent health, non-smoker, Cambridge MA",
  "preferences": "Willing to donate to compatible patient, can travel"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "test-donor-002",
  "name": "Michael Brown",
  "type": "donor",
  "bloodType": "A-",
  "age": 29,
  "country": "USA",
  "state": "New York",
  "city": "New York",
  "organType": "Liver",
  "description": "Living liver donor volunteer",
  "medicalInfo": "Blood type A-, age 29, perfect health, athletic lifestyle, New York NY",
  "preferences": "Altruistic donor, willing to help those in need"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "test-donor-003",
  "name": "Lisa Anderson",
  "type": "donor",
  "bloodType": "B+",
  "age": 40,
  "country": "USA",
  "state": "Illinois",
  "city": "Chicago",
  "organType": "Kidney",
  "description": "Kidney donor seeking recipient",
  "medicalInfo": "Blood type B+, age 40, excellent physical condition, non-smoker, Chicago IL",
  "preferences": "Prefer to help patient in Midwest region"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "test-donor-004",
  "name": "James Wilson",
  "type": "donor",
  "bloodType": "AB+",
  "age": 35,
  "country": "USA",
  "state": "Washington",
  "city": "Seattle",
  "organType": "Kidney",
  "description": "Universal kidney donor",
  "medicalInfo": "Blood type AB+, age 35, exceptional health, marathon runner, Seattle WA",
  "preferences": "Willing to donate to any compatible patient nationwide"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "test-donor-005",
  "name": "Amanda Lee",
  "type": "donor",
  "bloodType": "O-",
  "age": 26,
  "country": "USA",
  "state": "Colorado",
  "city": "Denver",
  "organType": "Liver",
  "description": "Living liver donor",
  "medicalInfo": "Blood type O-, age 26, perfect health records, non-smoker, Denver CO",
  "preferences": "Want to help save a life, flexible with location"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "test-donor-006",
  "name": "Christopher Davis",
  "type": "donor",
  "bloodType": "A+",
  "age": 42,
  "country": "USA",
  "state": "Massachusetts",
  "city": "Boston",
  "organType": "Kidney",
  "description": "Altruistic kidney donor",
  "medicalInfo": "Blood type A+, age 42, healthy lifestyle, non-drinker non-smoker, Boston MA",
  "preferences": "Looking to help local patient, family history of kidney disease awareness"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "test-donor-007",
  "name": "Patricia Taylor",
  "type": "donor",
  "bloodType": "B-",
  "age": 31,
  "country": "USA",
  "state": "Oregon",
  "city": "Portland",
  "organType": "Kidney",
  "description": "Directed kidney donor",
  "medicalInfo": "Blood type B-, age 31, excellent health, yoga instructor, Portland OR",
  "preferences": "Willing to travel anywhere in US, prefer younger recipients"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "test-donor-008",
  "name": "Steven Martinez",
  "type": "donor",
  "bloodType": "AB-",
  "age": 38,
  "country": "USA",
  "state": "Florida",
  "city": "Miami",
  "organType": "Liver",
  "description": "Liver portion donor volunteer",
  "medicalInfo": "Blood type AB-, age 38, exceptional fitness, non-smoker, Miami FL",
  "preferences": "Can donate liver portion, seeking compatible patient"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "australia-patient-001",
  "name": "Sophie Anderson",
  "type": "patient",
  "bloodType": "B+",
  "age": 28,
  "country": "Australia",
  "state": "New South Wales",
  "city": "Sydney",
  "organType": "Liver",
  "description": "Urgently need liver transplant, blood type B+",
  "medicalInfo": "Age 28, blood type B+, liver disease, non-smoker, otherwise healthy, in Sydney, New South Wales, Australia",
  "preferences": "Can travel to USA or Europe if needed"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "canada-donor-001",
  "name": "Michael Chen",
  "type": "donor",
  "bloodType": "O-",
  "age": 35,
  "country": "Canada",
  "state": "Ontario",
  "city": "Toronto",
  "organType": "Kidney",
  "description": "Willing to donate kidney, blood type O-",
  "medicalInfo": "Age 35, blood type O-, healthy, non-smoker, willing to donate kidney, Toronto, Ontario in Canada",
  "preferences": "Can travel to USA or Europe if needed"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "uk-patient-001",
  "name": "Emily Thompson",
  "type": "patient",
  "bloodType": "A+",
  "age": 42,
  "country": "UK",
  "state": "England",
  "city": "London",
  "organType": "Kidney",
  "description": "Seeking kidney donor, blood type A+",
  "medicalInfo": "Age 42, blood type A+, kidney failure, non-smoker, excellent health otherwise, London UK England",
  "preferences": "Prefer UK donor, willing to travel within Europe"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "germany-donor-001",
  "name": "Hans Mueller",
  "type": "donor",
  "bloodType": "AB+",
  "age": 45,
  "country": "Germany",
  "state": "Bavaria",
  "city": "Munich",
  "organType": "Liver",
  "description": "Willing to donate liver segment, blood type AB+",
  "medicalInfo": "Age 45, blood type AB+, excellent health, non-smoker, regular exercise, Munich, Bavaria, Germany",
  "preferences": "Willing to help patients in EU countries"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "japan-donor-001",
  "name": "Yuki Tanaka",
  "type": "donor",
  "bloodType": "A-",
  "age": 55,
  "country": "Japan",
  "state": "Tokyo",
  "city": "Tokyo",
  "organType": "Heart",
  "description": "Donate my heart, blood type A-",
  "medicalInfo": "Age 55, blood type A-, heart healthy, non-smoker, Tokyo, Japan",
  "preferences": "Seeking patient in Asia, willing to travel"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "india-donor-001",
  "name": "Priya Sharma",
  "type": "donor",
  "bloodType": "O+",
  "age": 32,
  "country": "India",
  "state": "Maharashtra",
  "city": "Mumbai",
  "organType": "Kidney",
  "description": "Willing to donate kidney, blood type O+",
  "medicalInfo": "Age 32, blood type O+, excellent health, non-smoker, vegetarian diet, Mumbai, Maharashtra, India",
  "preferences": "Prefer helping patients in India, open to international if urgent"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "brazil-patient-001",
  "name": "Carlos Silva",
  "type": "patient",
  "bloodType": "B-",
  "age": 38,
  "country": "Brazil",
  "state": "São Paulo",
  "city": "São Paulo",
  "organType": "Pancreas",
  "description": "Need pancreas transplant, blood type B-",
  "medicalInfo": "Age 38, blood type B-, pancreatic failure, diabetic, non-smoker, São Paulo, Brazil",
  "preferences": "Seeking donor in South America, willing to travel"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "china-donor-001",
  "name": "Li Wei",
  "type": "donor",
  "bloodType": "AB-",
  "age": 40,
  "country": "China",
  "state": "Shanghai",
  "city": "Shanghai",
  "organType": "Lung",
  "description": "Willing to donate lung, blood type AB-",
  "medicalInfo": "Age 40, blood type AB-, excellent respiratory health, non-smoker, athlete, Shanghai, China",
  "preferences": "Can travel within Asia for donation"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "mexico-patient-001",
  "name": "Maria Garcia",
  "type": "patient",
  "bloodType": "O+",
  "age": 47,
  "country": "Mexico",
  "state": "Jalisco",
  "city": "Guadalajara",
  "organType": "Kidney",
  "description": "Seeking kidney donor, blood type O+",
  "medicalInfo": "Age 47, blood type O+, chronic kidney disease, non-smoker, controlled diabetes, Guadalajara, Jalisco, Mexico",
  "preferences": "Prefer Mexican or US donor, bilingual Spanish/English"
}'

test_endpoint "POST" "/api/matching/store" "Store donor profile" '{
  "id": "usa-patient-marrow-001",
  "name": "David Johnson",
  "type": "patient",
  "bloodType": "A+",
  "age": 25,
  "country": "USA",
  "state": "New York",
  "city": "New York",
  "organType": "Marrow",
  "description": "Need bone marrow transplant, blood type A+",
  "medicalInfo": "Age 25, blood type A+, leukemia patient, non-smoker, fighting cancer, NYC, USA",
  "preferences": "Seeking bone marrow donor, HLA typing available"
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

