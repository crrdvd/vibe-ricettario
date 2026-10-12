#!/bin/bash
# Daily backup of the database and photos (run by vibe-ricettario-backup.timer)
# Each run creates $BACKUP_DIR/YYYY-MM-DD/ and keeps the newest $KEEP backups.
set -euo pipefail

DATA_DIR="${DATA_DIR:-/home/davide/data}"
BACKUP_DIR="${BACKUP_DIR:-$DATA_DIR/backups}"
KEEP="${KEEP:-30}"

today="$(date +%F)"
dest="$BACKUP_DIR/$today"
mkdir -p "$dest"
previous="$(find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -name '20*' ! -name "$today" | sort | tail -n 1)"

# .backup takes a consistent snapshot even while the app is writing
sqlite3 "$DATA_DIR/recipe_book.db" ".backup '$dest/recipe_book.db'"
check="$(sqlite3 "$dest/recipe_book.db" 'PRAGMA integrity_check')"
if [ "$check" != "ok" ]; then
    echo "Backup database non valido: $check" >&2
    exit 1
fi

# Photos: files unchanged since the previous backup are hard links, so they take no extra space
link_dest=()
if [ -n "$previous" ] && [ -d "$previous/uploads" ]; then
    link_dest=(--link-dest="$previous/uploads")
fi
rsync -a --delete "${link_dest[@]}" "$DATA_DIR/uploads/" "$dest/uploads/"

# Retention
find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -name '20*' | sort | head -n -"$KEEP" | xargs -r rm -rf

echo "Backup completato: $dest"
