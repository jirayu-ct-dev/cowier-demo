#!/bin/sh
set -eu

test_database="${MYSQL_TEST_DATABASE:-ciwie_test}"

case "$test_database" in
  *[!A-Za-z0-9_]*|'')
    echo "MYSQL_TEST_DATABASE must contain only letters, numbers, and underscores" >&2
    exit 1
    ;;
esac

mysql --protocol=socket -uroot -p"$MYSQL_ROOT_PASSWORD" <<SQL
CREATE DATABASE IF NOT EXISTS \`$test_database\`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON \`$test_database\`.* TO '$MYSQL_USER'@'%';
SQL
