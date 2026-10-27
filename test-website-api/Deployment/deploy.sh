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

echo 'Enabling the maintenance page while the source is rebuilt on the Pi.'
touch maintenance/enabled
# On the first deployment, build only Caddy + the maintenance page, without Node.
if ! docker image inspect sawftware-web:pi-armv7 >/dev/null 2>&1; then
    docker build --platform linux/arm/v7 --target maintenance \
        -f Dockerfile.web -t sawftware-web:pi-armv7 ../..
fi
# This also upgrades existing deployments to the mounted maintenance configuration.
docker compose up -d --no-deps --no-build web
attempt=0
until docker compose exec -T web caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 15 ]; then
        echo 'Caddy could not load the maintenance configuration; backend services have not been stopped.' >&2
        docker compose logs --tail=50 web
        exit 1
    fi
    sleep 1
done
# Keep the lightweight web server running; retain all persistent volumes.
docker compose stop api db
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
rm -f maintenance/enabled
git rev-parse HEAD > .deployed-revision
docker compose ps
echo 'Deployment ready. Open the website at the address in .env.'
