#!/bin/bash
# Run skill trigger tests using Claude Code CLI
# Usage: ./tests/run-tests.sh [--verbose]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERBOSE=false

if [[ "$1" == "--verbose" || "$1" == "-v" ]]; then
  VERBOSE=true
fi

# Check for claude CLI
if ! command -v claude &> /dev/null; then
  echo "Error: claude CLI not found. Install with: npm install -g @anthropic-ai/claude-code"
  exit 1
fi

# Check for yq (YAML parser)
if ! command -v yq &> /dev/null; then
  echo "Error: yq not found. Install with: brew install yq"
  exit 1
fi

# Extract skills list
echo "Extracting skills..."
SKILLS_LIST=$("$SCRIPT_DIR/extract-skills.sh")

if [[ -z "$SKILLS_LIST" ]]; then
  echo "Error: No skills found"
  exit 1
fi

SKILLS_COUNT=$(echo "$SKILLS_LIST" | wc -l | tr -d ' ')
echo "Found $SKILLS_COUNT skills"

# Read test cases
TEST_FILE="$SCRIPT_DIR/trigger-tests.yml"
if [[ ! -f "$TEST_FILE" ]]; then
  echo "Error: Test file not found: $TEST_FILE"
  exit 1
fi

TEST_COUNT=$(yq '.tests | length' "$TEST_FILE")
echo "Running $TEST_COUNT tests..."
echo ""

PASSED=0
FAILED=0
FAILED_TESTS=""

for i in $(seq 0 $((TEST_COUNT - 1))); do
  PROMPT=$(yq ".tests[$i].prompt" "$TEST_FILE" | tr -d '"')
  EXPECTED=$(yq ".tests[$i].expected" "$TEST_FILE" | tr -d '"')

  # Build the prompt for Claude
  CLAUDE_PROMPT="Given these available skills:

$SKILLS_LIST

Which single skill best matches this user request: \"$PROMPT\"

Reply with ONLY the skill name, nothing else."

  # Call Claude CLI
  RESPONSE=$(claude -p "$CLAUDE_PROMPT" --model haiku 2>/dev/null | tr -d '[:space:]')

  # Check result
  if [[ "$RESPONSE" == "$EXPECTED" ]]; then
    if $VERBOSE; then
      echo "PASS: \"$PROMPT\" -> $RESPONSE"
    else
      echo -n "."
    fi
    ((PASSED++))
  else
    if $VERBOSE; then
      echo "FAIL: \"$PROMPT\""
      echo "  Expected: $EXPECTED"
      echo "  Got: $RESPONSE"
    else
      echo -n "F"
    fi
    ((FAILED++))
    FAILED_TESTS="$FAILED_TESTS\n  - \"$PROMPT\" (expected: $EXPECTED, got: $RESPONSE)"
  fi
done

echo ""
echo ""
echo "Results: $PASSED passed, $FAILED failed"

if [[ $FAILED -gt 0 ]]; then
  echo ""
  echo "Failed tests:$FAILED_TESTS"
  exit 1
fi
