#!/usr/bin/env bash

BASE_URL="https://pepertect-admin-panel.vercel.app"
COOKIE_FILE="/tmp/admin-cookies.txt"

echo "=================================="
echo "Pepertect Admin Panel Testing"
echo "=================================="
echo ""

# 1. Test Login
echo "1. Testing Login..."
echo "   URL: ${BASE_URL}/api/admin/auth"
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/admin/auth" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -c "$COOKIE_FILE")

echo "   Response: $LOGIN_RESPONSE"
echo ""

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ Login SUCCESSFUL"
    echo ""
else
    echo "   ❌ Login FAILED"
    exit 1
fi

# 2. Test Dashboard
echo "2. Testing Dashboard..."
echo "   URL: ${BASE_URL}/admin/dashboard"
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_FILE" "${BASE_URL}/admin/dashboard")
echo "   Status: $DASHBOARD_STATUS"
if [ "$DASHBOARD_STATUS" = "200" ]; then
    echo "   ✅ Dashboard loaded"
else
    echo "   ❌ Dashboard failed (Status: $DASHBOARD_STATUS)"
fi
echo ""

# 3. Test Dashboard API
echo "3. Testing Dashboard API..."
DASHBOARD_API=$(curl -s -b "$COOKIE_FILE" "${BASE_URL}/api/admin/dashboard")
if echo "$DASHBOARD_API" | grep -q '"success":true'; then
    TOTAL_USERS=$(echo "$DASHBOARD_API" | grep -o '"totalUsers":[0-9]*' | cut -d: -f2)
    ACTIVE_USERS=$(echo "$DASHBOARD_API" | grep -o '"activeUsers":[0-9]*' | cut -d: -f2)
    PREMIUM_USERS=$(echo "$DASHBOARD_API" | grep -o '"premiumUsers":[0-9]*' | cut -d: -f2)
    echo "   ✅ Dashboard API working"
    echo "   - Total Users: $TOTAL_USERS"
    echo "   - Active Users: $ACTIVE_USERS"
    echo "   - Premium Users: $PREMIUM_USERS"
else
    echo "   ❌ Dashboard API failed"
    echo "   Response: $DASHBOARD_API"
fi
echo ""

# 4. Test each section
SECTIONS=(
    "/admin/users"
    "/admin/subscriptions"
    "/admin/trading"
    "/admin/market"
    "/admin/challenges"
    "/admin/learning"
    "/admin/support"
    "/admin/notifications"
    "/admin/analytics"
    "/admin/settings"
    "/admin/profile"
)

echo "4. Testing All Sections..."
echo "-----------------------------------"

WORKING_COUNT=0
FAILING_COUNT=0
FAILING_SECTIONS=()

for section in "${SECTIONS[@]}"; do
    SECTION_NAME=$(echo "$section" | cut -d/ -f3 | sed 's/\b\(.\)/\u\1/g')
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_FILE" "${BASE_URL}${section}")
    
    if [ "$STATUS" = "200" ]; then
        echo "   ✅ $SECTION_NAME ($STATUS)"
        ((WORKING_COUNT++))
    else
        echo "   ❌ $SECTION_NAME ($STATUS)"
        ((FAILING_COUNT++))
        FAILING_SECTIONS+=("$section - Status: $STATUS")
    fi
done

echo ""
echo "=================================="
echo "Test Summary"
echo "=================================="
echo "✅ Working Sections: $WORKING_COUNT/${#SECTIONS[@]}"
echo "❌ Failing Sections: $FAILING_COUNT/${#SECTIONS[@]}"
echo ""

if [ ${#FAILING_SECTIONS[@]} -gt 0 ]; then
    echo "Failing Sections:"
    for section in "${FAILING_SECTIONS[@]}"; do
        echo "  - $section"
    done
fi

echo ""
echo "=================================="
echo "Final Status"
echo "=================================="
if [ $FAILING_COUNT -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED!"
else
    echo "⚠️  SOME TESTS FAILED"
fi

# Cleanup
rm -f "$COOKIE_FILE"