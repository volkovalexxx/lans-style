#!/usr/bin/env bash
# Safe production deploy for lans-style.
# - backs up the database first
# - rebuilds ONLY server + client (postgres and its volume are never touched)
# - verifies the site, API and row counts afterwards
# - rolls back automatically to the previous commit if anything fails
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
DB_CT="lans_postgres"; SRV_CT="lans_server"
SITE="lans-style.by"
BACKUP_DIR="/root/backups"

say()  { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m    ✓ %s\033[0m\n' "$*"; }
die()  { printf '\n\033[1;31m✗ %s\033[0m\n' "$*"; exit 1; }

# --- locate project dir from the running container ---
PROJECT_DIR="$(docker inspect "$SRV_CT" -f '{{ index .Config.Labels "com.docker.compose.project.working_dir" }}' 2>/dev/null || true)"
[ -n "$PROJECT_DIR" ] && [ -f "$PROJECT_DIR/$COMPOSE_FILE" ] || die "Не нашёл папку проекта через контейнер $SRV_CT"
cd "$PROJECT_DIR"
ok "Папка проекта: $PROJECT_DIR"
[ -d .git ] || die "В $PROJECT_DIR нет git-репозитория — остановился, ничего не менял"

DC="docker compose -f $COMPOSE_FILE"
docker compose version >/dev/null 2>&1 || DC="docker-compose -f $COMPOSE_FILE"

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  git status --short --untracked-files=no
  die "На сервере есть незакоммиченные правки в файлах проекта — остановился, ничего не менял"
fi
OLD="$(git rev-parse HEAD)"
ok "Текущая версия: $(git log -1 --oneline)"

count() { docker exec "$DB_CT" psql -U lans -d lans_style -tAc "select count(*) from \"$1\""; }
counts() { echo "$(count Product)/$(count Category)/$(count ProductCategory)/$(count Order)"; }

# --- 1. backup ---
say "1/5 Бэкап базы"
mkdir -p "$BACKUP_DIR"
BK="$BACKUP_DIR/lans_$(date +%F_%H%M%S).sql"
docker exec "$DB_CT" pg_dump -U lans lans_style > "$BK"
[ -s "$BK" ] || die "Бэкап пустой — остановился"
BEFORE="$(counts)"
ok "Бэкап: $BK ($(du -h "$BK" | cut -f1))"
ok "Товары/категории/связи/заказы: $BEFORE"

# --- 2. fetch code ---
say "2/5 Забираю код с GitHub"
git fetch origin main
git log --oneline HEAD..origin/main
git show origin/main:server/src/routes/export.ts >/dev/null 2>&1 || die "В origin/main нет выгрузки — сначала сделай git push с Мака"
git merge --ff-only origin/main
NEW="$(git rev-parse HEAD)"
ok "Новая версия: $(git log -1 --oneline)"

rollback() {
  printf '\n\033[1;33m!!! Откатываюсь на %s\033[0m\n' "$OLD"
  git reset --hard "$OLD"
  $DC build server client && $DC up -d --no-deps server client
  printf '\033[1;33mОткат выполнен. Бэкап БД: %s\033[0m\n' "$BK"
  exit 1
}

# --- 3. build (old containers keep serving while this runs) ---
say "3/5 Сборка образов (сайт пока работает на старой версии)"
if ! $DC build server client; then
  git reset --hard "$OLD"
  die "Сборка не прошла — вернул код, контейнеры не трогал, сайт работает как раньше"
fi
ok "Собрано"

# --- 4. restart only server + client ---
say "4/5 Перезапуск server и client (postgres не трогается)"
$DC up -d --no-deps server client || rollback

# --- 5. verify ---
say "5/5 Проверки"
code() { curl -sk -o /dev/null -w '%{http_code}' --resolve "$SITE:443:127.0.0.1" "https://$SITE$1" || echo 000; }
for i in $(seq 1 40); do [ "$(code /api/health)" = 200 ] && break; sleep 3; done
[ "$(code /api/health)" = 200 ] || { docker logs --tail 40 "$SRV_CT"; rollback; }
ok "API /api/health → 200"
[ "$(code /)" = 200 ] || rollback;                           ok "Главная → 200"
[ "$(code '/api/products?limit=1')" = 200 ] || rollback;     ok "Каталог API → 200"
[ "$(code /api/categories)" = 200 ] || rollback;             ok "Категории API → 200"
[ "$(code /api/export/catalog)" = 401 ] || rollback;         ok "Выгрузка закрыта авторизацией → 401"
AFTER="$(counts)"
[ "$AFTER" = "$BEFORE" ] || { echo "было $BEFORE, стало $AFTER"; rollback; }
ok "Данные на месте: $AFTER"

printf '\n\033[1;32m✅ Готово. Деплой %s → %s\033[0m\n' "${OLD:0:7}" "${NEW:0:7}"
echo "   Бэкап БД: $BK"
