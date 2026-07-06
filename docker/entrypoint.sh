#!/bin/sh
set -e

# The db and the file root live under the mounted /data volume, so create them
# before the server canonicalizes the root on boot.
mkdir -p /data/files

exec attic "$@"
