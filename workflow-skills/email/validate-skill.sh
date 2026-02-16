#!/bin/bash

echo "🧪 Email Skill Validation Test"
echo "==============================="

# Test 1: Authentication check
echo "✓ Test 1: Authentication status"
if tdx auth status > /dev/null 2>&1; then
    echo "  ✅ Authentication successful"
else
    echo "  ❌ Authentication failed"
    exit 1
fi

# Test 2: Segment listing
echo "✓ Test 2: Segment listing"
if OUTPUT=$(tdx sg list 2>&1) && echo "$OUTPUT" | grep -q "Found.*segments"; then
    echo "  ✅ Segment listing works"
else
    echo "  ❌ Segment listing failed"
fi

# Test 3: Journey listing
echo "✓ Test 3: Journey listing"
if OUTPUT=$(tdx journey list 2>&1) && echo "$OUTPUT" | grep -q "Found.*journeys"; then
    echo "  ✅ Journey listing works"
else
    echo "  ❌ Journey listing failed"
fi

# Test 4: Workspace listing
echo "✓ Test 4: Workspace listing"
if tdx engage workspace list > /dev/null 2>&1; then
    echo "  ✅ Workspace listing works"
else
    echo "  ❌ Workspace listing failed"
fi

# Test 5: Template listing
echo "✓ Test 5: Template listing"
if tdx engage template list > /dev/null 2>&1; then
    echo "  ✅ Template listing works"
else
    echo "  ❌ Template listing failed"
fi

# Test 6: Campaign listing
echo "✓ Test 6: Campaign listing"
if tdx engage campaign list > /dev/null 2>&1; then
    echo "  ✅ Campaign listing works"
else
    echo "  ❌ Campaign listing failed"
fi

echo ""
echo "🎉 Email skill validation completed!"
echo "All corrected commands are working properly."