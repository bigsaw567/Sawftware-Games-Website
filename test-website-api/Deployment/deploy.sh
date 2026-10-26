#!/bin/sh
# Rebuild the checked-out revision. Called manually or by the Pi's Git pull hook.
set -eu
umask 077
deployment_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$deployment_dir"

if [ ! -f .env ]; then
    echo 'Run sh test-website-api/Deployment/setup-pi.sh from the repository first.' >&2
    exit 1
fi
docker compose config --quiet
exec 9> .deploy.lock
flock -n 9 || { echo 'Another deployment is already running.' >&2; exit 1; }

echo 'Building the checked-out source on the Pi. The website pauses during deployment.'
# Free RAM for the two builds; named volumes are retained.
docker compose stop web api db
docker compose build web
docker compose build api
docker compose up -d --wait db

mkdir -p backups
backup="backups/database-$(date -u +%Y%m%d-%H%M%S)-$$.dump"
echo "Saving database backup to $backup"
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$backup.partial"
mv "$backup.partial" "$backup"

docker compose run --rm --no-deps migrate
docker compose up -d api web
attempt=0
until docker compose exec -T web wget -q -O /dev/null http://api:8080/api/health; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 30 ]; then
        echo 'The API did not become ready. Deployment has not been marked successful.' >&2
        docker compose logs --tail=50 api web
        exit 1
    fi
    sleep 2
done
git rev-parse HEAD > .deployed-revision
docker compose ps
echo 'Deployment ready. Open the website at the address in .env.'
