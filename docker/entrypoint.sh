#!/bin/sh
set -e

mkdir -p /data/files

exec attic "$@"
