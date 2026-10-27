# Deploy by pushing and pulling Git

Commit the source and deployment files to GitHub. On the Pi, a one-time setup
installs a local Git hook. After that, **git pull rebuilds and updates the website**.
Docker builds Angular and .NET on the Pi; no Windows builds or archives are needed.

## One-time setup on the Pi

Run in a terminal on the Pi, with Git, Docker Engine, and Docker Compose v2.20+
installed and usable by your current user:

```sh
git clone https://github.com/bigsaw567/Sawftware-Games-Website.git
cd Sawftware-Games-Website
sh test-website-api/Deployment/setup-pi.sh
```

If already cloned, pull the new deployment files and run just the setup command.
The setup generates a private database password in `test-website-api/Deployment/.env`
(ignored by Git) and defaults the website address to `https://YOUR_PI_HOSTNAME.local`,
for example `https://raspberrypi.local`. It prints the address. You need no SSH
username or numeric IP when running these commands directly on the Pi.

If previously deployed using the archive, copy that deployment's existing `.env`
into `test-website-api/Deployment/.env` before setup. Existing database volumes
are retained; setup refuses to generate a new password if it detects an existing
Pi deployment database without the matching configuration. Windows databases and
user secrets remain unchanged; Windows accounts are not copied to the Pi.

To choose a different address before first setup:

```sh
SITE_ADDRESS=https://raspberrypi.local sh test-website-api/Deployment/setup-pi.sh
```

You can also edit `SITE_ADDRESS` in `.env` later and run the deploy script again.
Setup installs the hook only in this Pi clone. It leaves an unrelated existing
post-merge hook untouched; if one exists, integrate it manually or use the manual
deploy command below. Run setup as your normal Pi user, not inside Windows.

## Every update

Commit and push normally on Windows. On the Pi, from the repository directory:

```sh
git pull
```

The installed hook runs `deploy.sh` after a successful source update. Setup
configures fast-forward-only pulls in this clone. A pull with no new commits does
not rebuild. Manual checkouts and rebases do not trigger this hook. See the
[Git hook documentation](https://git-scm.com/docs/githooks#_post_merge).

Deployment enables a maintenance page and keeps Caddy running while the backend
and database are stopped. It builds the frontend and backend one at a time,
starts PostgreSQL, saves a backup, applies pending EF migrations, and starts the
updated site. Once API/database health passes, it removes maintenance mode.
Visitors see the maintenance message and Sawyer's contact email during builds.
The first build downloads the build/runtime images; subsequent builds use
Docker's dependency cache. Angular uses one build worker.

If a build is killed with exit code 137, check `free -h` and provide swap on the Pi
before retrying. Sequential builds reduce memory use but cannot guarantee every
1 GB OS installation can build without swap.

To retry a failed deployment or rebuild without pulling:

```sh
sh test-website-api/Deployment/deploy.sh
```

If deployment fails, Git has still updated the source. Fix the reported error,
then run that command. The script stops at failures and does not erase volumes
or roll back your database. Private backups are in `Deployment/backups/`, ignored
by Git. Keep copies off the SD card. Do not run `docker compose down -v`, which
would delete persistent database/certificate volumes.

If a build, migration, or health check fails, the maintenance page stays enabled
until a successful deployment. Even the first deployment can show maintenance
before Angular or .NET finishes building: it first prepares a small Caddy-only
image. Caddy may briefly disconnect while its container is replaced at the end
of an update; this is a single-web-server deployment.

For manual maintenance, from `test-website-api/Deployment`:

```sh
touch maintenance/enabled
```

After completing your work, `rm -f maintenance/enabled` restores the site. No
Caddy restart is needed to toggle the page. Responses use HTTP 503, `Retry-After`,
and `Cache-Control: no-store`, including API requests. A proxy connection failure
also shows the maintenance message. An already-open Angular page will display
the maintenance screen when the visitor refreshes or navigates to the website;
there is no live push notification to existing tabs.

## Open the website

Visit the hostname printed by setup from another computer on your home network.
If `.local` names do not resolve on your network, use the Pi's LAN IP as
`SITE_ADDRESS` instead. The address is for visiting the site, not transferring files.

Caddy uses local HTTPS so secure login cookies work. Each client must trust the
Pi's Caddy root certificate once. Existing Caddy certificate volumes preserve any
trust you already configured. On the Pi:

```sh
cd test-website-api/Deployment
docker compose cp web:/data/caddy/pki/authorities/local/root.crt ./caddy-root.crt
```

Copy only this public certificate to Windows using a USB drive or your preferred
file-transfer method. Do not copy Caddy's private keys. In Windows PowerShell,
from the directory containing the certificate:

```powershell
certutil -user -addstore Root .\caddy-root.crt
curl.exe --fail https://raspberrypi.local/api/health
```

Use your actual hostname. Expect `{"status":"ready"}`. Open the site, sign up,
and log in; requests go to the same hostname under `/api/auth/...`. Firefox may
need the root imported into its own certificate-authority settings. See
[Caddy local HTTPS](https://caddyserver.com/docs/automatic-https#local-https).

## Useful commands

From `test-website-api/Deployment` on the Pi:

```sh
docker compose ps
docker compose logs --tail=50 api web db
docker stats
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

In psql, `SELECT "Id", "Name", "Email" FROM public."Users";` lists accounts;
`\q` exits. Only Caddy publishes ports 80/443. API routes, persistent database and
cookie-key volumes, Caddy certificates, and restart policies are preserved.
Keep this as a LAN deployment without router port forwarding.

For migration-only operation, after building the API image and starting the DB:

```sh
docker compose run --rm --no-deps migrate
```

The deploy script calls this explicitly; normal API startup does not migrate.
Keep `.env` across pulls and never commit it. Changing credentials in `.env` does
not change credentials inside an already initialized PostgreSQL database.

## Architecture checks and local development

All runtime and build images have verified `linux/arm/v7` support. Exact tags and
observed registry digests are in `runtime-images.json` and `build-images.json`.
Refresh verification from Windows (Python 3):

```powershell
python .\Deployment\verify-images.py
```

Windows development remains `dotnet run --launch-profile http` for the backend and
`npm start` in the Angular project. Local data and credentials are unchanged.
Docker build contexts allow only source/config/assets, excluding Windows build
outputs, dependency folders, and private deployment configuration. The obsolete
Windows archive-build script has been removed.

Docker Engine is not installed in this Windows workspace. Registry manifests,
Compose configuration, shell syntax, and the Git-pull orchestration can be tested
here; native Docker builds and memory use still require the Pi. The feedback
backend remains a pre-existing unfinished feature.
