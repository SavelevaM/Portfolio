#!/usr/bin/env bash
# Прогнать на СЕРВЕРЕ под root (или через sudo bash deploy-user-setup.sh)
set -euo pipefail

DEPLOY_PATH="/opt/portfolio/kishmish"
DOCKER_NETWORK="inside-net"

# 1. Пользователь deploy — создаём, если ещё нет
if id deploy &>/dev/null; then
  echo "Пользователь deploy уже существует — пропускаю создание."
else
  useradd -m -s /bin/bash deploy
  echo "Пользователь deploy создан."
fi

# 2. Права на запуск docker без sudo
if ! getent group docker &>/dev/null; then
  groupadd docker
fi
usermod -aG docker deploy
echo "deploy добавлен в группу docker."

# 3. Каталог проекта
mkdir -p "$DEPLOY_PATH"
chown -R deploy:deploy "$DEPLOY_PATH"
echo "Каталог $DEPLOY_PATH готов, владелец — deploy."

# 4. Внешняя docker-сеть, которую ждёт docker-compose.yaml
if ! docker network inspect "$DOCKER_NETWORK" &>/dev/null; then
  docker network create "$DOCKER_NETWORK"
  echo "Сеть $DOCKER_NETWORK создана."
else
  echo "Сеть $DOCKER_NETWORK уже существует."
fi

# 5. SSH-доступ для deploy
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

echo ""
echo "Готово. Осталось:"
echo "1) На своей машине: ssh-keygen -t ed25519 -f ~/.ssh/portfolio_deploy -N \"\""
echo "2) Публичный ключ добавить в /home/deploy/.ssh/authorized_keys на сервере"
echo "   (можно так: ssh-copy-id -i ~/.ssh/portfolio_deploy.pub deploy@<HOST>)"
echo "3) Проверить без sudo: ssh deploy@<HOST> docker ps"
echo "   (если 'permission denied' — перелогинься по SSH, группа docker применяется к новым сессиям)"
