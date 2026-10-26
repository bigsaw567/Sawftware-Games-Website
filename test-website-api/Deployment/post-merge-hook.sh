#!/bin/sh
# sawftware-pi-auto-deploy
# Installed only into the Pi clone, never into the Windows development clone.
set -eu
repository=$(git rev-parse --show-toplevel)
if ! sh "$repository/test-website-api/Deployment/deploy.sh"; then
    echo 'Git updated the source, but deployment failed. The source pull is not rolled back.' >&2
    echo 'Fix the error above, then run: sh test-website-api/Deployment/deploy.sh' >&2
    exit 1
fi
