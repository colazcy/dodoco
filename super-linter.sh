#!/bin/bash
clear
if [ -z "$(git ls-files --others --exclude-standard)" ] && [ -z "$(git diff)" ]; then
        docker run -e LOG_LEVEL=INFO -e DEFAULT_BRANCH="$(git rev-parse --abbrev-ref HEAD)" -e RUN_LOCAL=true --env-file ".github/super-linter.env" -v "$(pwd)":/tmp/lint ghcr.io/super-linter/super-linter:slim-v7.3.0
else
        echo "There are unstaged changes or untracked files."
fi
