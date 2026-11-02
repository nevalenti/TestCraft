#!/usr/bin/env bash
set -euo pipefail

output_file=.local/glitchtip/dsn

for _ in {1..60}; do
    if [[ -s "$output_file" ]]; then
        break
    fi
    sleep 1
done

if [[ ! -s "$output_file" ]]; then
    echo "GlitchTip bootstrap did not produce a DSN: $output_file" >&2
    exit 1
fi

dsn=$(<"$output_file")

update_env() {
    local file=$1
    local key=$2
    local value=$3
    local temporary

    [[ -f "$file" ]] || return 0
    temporary=$(mktemp)
    awk -v key="$key" -v value="$value" '
        BEGIN { updated = 0 }
        index($0, key "=") == 1 { print key "=" value; updated = 1; next }
        { print }
        END { if (!updated) print key "=" value }
    ' "$file" > "$temporary"
    mv "$temporary" "$file"
}

update_env .env GLITCHTIP_DSN "$dsn"
update_env apps/web/.env VITE_GLITCHTIP_DSN "$dsn"
