#!/bin/sh
set -e
# Railway inyecta PORT; nginx debe escuchar en ese puerto
PORT="${PORT:-80}"
echo "Listening on port $PORT"
sed "s/__PORT__/$PORT/g" /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf
exec nginx -g "daemon off;"
