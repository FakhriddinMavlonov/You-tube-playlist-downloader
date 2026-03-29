#!/bin/bash

# 1. Telegram Bot API serverini yuklab olish
echo "📥 Telegram Bot API server yuklanmoqda..."
# Linux 64-bit uchun mos keladigan versiya
curl -L "https://github.com/tdlib/telegram-bot-api/releases/download/v6.3/telegram-bot-api-linux-amd64" -o telegram-bot-api

chmod +x telegram-bot-api
mkdir -p ./tg-data

# 2. Local Serverni ishga tushirish
echo "🚀 Local Server ishga tushmoqda..."
./telegram-bot-api \
    --api-id=33279940 \
    --api-hash=ebec3314c624540f0591ec66eb021ca0 \
    --local \
    --http-port=8081 \
    --dir=./tg-data &

# 15 soniya kutamiz
sleep 15

# 3. Botni ishga tushirish
echo "🤖 Bot ishga tushmoqda..."
node bot.js