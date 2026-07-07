#!/bin/sh
set -e

mkdir -p /data/roots

exec attic "$@"
