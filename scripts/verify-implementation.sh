#!/bin/bash
# Verification script for adaptive-workflow library implementation

set -e

echo "========================================="
echo "Adaptive Workflow Library Verification"
echo "========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check all modules exist
echo "1. Checking module files..."
MODULES=(
  "lib/schema-validator.js"
  "lib/template-renderer.js"
  "lib/state-manager.js"
  "lib/pattern-detector.js"
  "lib/scheduler/dependency-graph.js"
  "lib/scheduler/task-scheduler.js"
  "lib/scheduler/worktree-tracker.js"
  "lib/scheduler/merge-analyzer.js"
  "lib/discovery/capability-scanner.js"
  "lib/discovery/agent-discovery.js"
  "lib/discovery/skill-discovery.js"
  "lib/discovery/mcp-discovery.js"
  "lib/discovery/cache-manager.js"
)

MISSING=0
for module in "${MODULES[@]}"; do
  if [ -f "$module" ]; then
    echo -e "  ${GREEN}✓${NC} $module"
  else
    echo -e "  ${RED}✗${NC} $module (MISSING)"
    MISSING=$((MISSING + 1))
  fi
done

if [ $MISSING -gt 0 ]; then
  echo -e "\n${RED}ERROR: $MISSING modules missing!${NC}"
  exit 1
fi

echo -e "\n${GREEN}All 13 modules found!${NC}\n"

# Check all test files exist
echo "2. Checking test files..."
TEST_FILES=(
  "test/lib/schema-validator.test.js"
  "test/lib/template-renderer.test.js"
  "test/lib/state-manager.test.js"
  "test/lib/pattern-detector.test.js"
  "test/lib/scheduler/dependency-graph.test.js"
  "test/lib/scheduler/task-scheduler.test.js"
  "test/lib/scheduler/worktree-tracker.test.js"
  "test/lib/scheduler/merge-analyzer.test.js"
  "test/lib/discovery/capability-scanner.test.js"
  "test/lib/discovery/agent-discovery.test.js"
  "test/lib/discovery/skill-discovery.test.js"
  "test/lib/discovery/mcp-discovery.test.js"
  "test/lib/discovery/cache-manager.test.js"
  "test/integration.test.js"
)

MISSING_TESTS=0
for test_file in "${TEST_FILES[@]}"; do
  if [ -f "$test_file" ]; then
    echo -e "  ${GREEN}✓${NC} $test_file"
  else
    echo -e "  ${RED}✗${NC} $test_file (MISSING)"
    MISSING_TESTS=$((MISSING_TESTS + 1))
  fi
done

if [ $MISSING_TESTS -gt 0 ]; then
  echo -e "\n${YELLOW}WARNING: $MISSING_TESTS test files missing${NC}\n"
fi

# Run tests
echo -e "\n3. Running tests..."
npm test 2>&1 | tee test-results.log

# Extract test results
PASSED=$(grep "Tests:" test-results.log | tail -1 | grep -oP '\d+ passed' || echo "0 passed")
FAILED=$(grep "Tests:" test-results.log | tail -1 | grep -oP '\d+ failed' || echo "0 failed")
TOTAL=$(grep "Tests:" test-results.log | tail -1 | grep -oP 'Tests: .* total' || echo "Tests: 0 total")

echo ""
echo "========================================="
echo "Test Results:"
echo "  ${GREEN}$PASSED${NC}"
echo "  ${RED}$FAILED${NC}"
echo "  $TOTAL"
echo "========================================="

# Check coverage
echo -e "\n4. Checking coverage..."
npm run test:coverage 2>&1 | tee coverage-results.log

# Extract coverage
STMT_COV=$(grep "All files" coverage-results.log | awk '{print $2}' || echo "0")
BRANCH_COV=$(grep "All files" coverage-results.log | awk '{print $4}' || echo "0")
FUNC_COV=$(grep "All files" coverage-results.log | awk '{print $6}' || echo "0")
LINE_COV=$(grep "All files" coverage-results.log | awk '{print $8}' || echo "0")

echo ""
echo "========================================="
echo "Coverage Results:"
echo "  Statements: $STMT_COV"
echo "  Branches:   $BRANCH_COV"
echo "  Functions:  $FUNC_COV"
echo "  Lines:      $LINE_COV"
echo "========================================="

# Final summary
echo -e "\n5. Summary"
echo "========================================="
echo "  Modules: 13/13"
echo "  Test Files: $((${#TEST_FILES[@]} - MISSING_TESTS))/${#TEST_FILES[@]}"
echo "  Test Results: $TOTAL"
echo "  Coverage: Statements $STMT_COV, Branches $BRANCH_COV"
echo "========================================="

if [[ "$FAILED" == *"0 failed"* ]]; then
  echo -e "\n${GREEN}✓ All tests passing!${NC}"
  exit 0
else
  echo -e "\n${RED}✗ Some tests failing${NC}"
  exit 1
fi
