#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "→ Проверка изменений..."
git add -A

if git diff --cached --quiet; then
  echo "Изменений нет — публиковать нечего."
  exit 0
fi

git diff --cached --stat

if [ -n "$1" ]; then
  MESSAGE="$1"
else
  read -p "Введи описание изменений: " MESSAGE || true
  if [ -z "$MESSAGE" ]; then
    MESSAGE="Update site"
  fi
fi

git commit -m "$MESSAGE"
git push

echo ""
echo "✓ Опубликовано! Через ~1 мин изменения появятся на https://cosmoodev.github.io/"
