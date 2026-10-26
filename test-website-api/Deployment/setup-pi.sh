#!/bin/sh
# One-time setup in the Pi clone. Run with sh; executable Git file modes aren't required.
set -eu
umask 077
deployment_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repository=$(git -C "$deployment_dir" rev-parse --show-toplevel)
cd "$repository"

if [ "$(uname -s)" != Linux ]; then
    echo 'Run this setup on the Raspberry Pi, not the Windows development computer.' >&2
    exit 1
fi
command -v flock >/dev/null
docker compose version
docker info >/dev/null

if [ ! -f "$deployment_dir/.env" ]; then
    if docker volume inspect sawftware-games_postgres_data >/dev/null 2>&1; then
        echo 'An existing Pi database was found. Copy its existing .env into this Deployment folder first.' >&2
        echo 'The database has not been changed.' >&2
        exit 1
    fi
    password=$(od -An -N32 -tx1 /dev/urandom | tr -d ' \n')
    address=${SITE_ADDRESS:-https://$(hostname).local}
    printf 'SITE_ADDRESS=%s\nPOSTGRES_DB=sawftware_games\nPOSTGRES_USER=sawftware\nPOSTGRES_PASSWORD=%s\n' \
        "$address" "$password" > "$deployment_dir/.env"
    unset password
    echo "Created private configuration. Website address: $address"
else
    echo 'Keeping your existing .env and database settings.'
fi
chmod 600 "$deployment_dir/.env"

# Do not overwrite an unrelated hook or change hooks in the Windows clone.
hook=$(git rev-parse --git-path hooks/post-merge)
if [ -f "$hook" ] && ! grep -q 'sawftware-pi-auto-deploy' "$hook"; then
    echo "An existing post-merge hook is present at $hook; it has been left unchanged." >&2
    echo 'Use sh test-website-api/Deployment/deploy.sh after each pull, or integrate the hooks manually.' >&2
    exit 1
fi
mkdir -p "$(dirname -- "$hook")"
cp "$deployment_dir/post-merge-hook.sh" "$hook"
chmod 755 "$hook"
# Ordinary git pull uses merge/fast-forward, which triggers the post-merge hook.
git config --local pull.rebase false
git config --local pull.ff only
echo 'Installed automatic deployment after git pull in this Pi clone.'
sh "$deployment_dir/deploy.sh"
