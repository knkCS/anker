#!/bin/bash
# Pre-commit quality gate for Claude Code.
# Runs typecheck and lint before any `git commit` command.
# Exit 2 blocks the commit; stderr is shown to Claude as feedback.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command')

# Only gate git commit commands
if echo "$COMMAND" | grep -qE '^git commit'; then
  echo "Running typecheck..." >&2
  npm run typecheck >&2 || {
    echo "Typecheck failed — commit blocked" >&2
    exit 2
  }

  echo "Running lint..." >&2
  npm run lint >&2 || {
    echo "Lint failed — commit blocked" >&2
    exit 2
  }
fi

exit 0
