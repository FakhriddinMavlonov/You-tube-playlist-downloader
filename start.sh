#!/bin/bash

# 1. Telegram Bot API serverini yuklab olish
echo "📥 Telegram Bot API server yuklanmoqda..."
curl -L https://github.com/tdlib/telegram-bot-api/releases/download/v6.7/telegram-bot-api-linux-amd64 -o telegram-bot-api
chmod +x telegram-bot-api

# 2. Ma'lumotlar papkasini yaratish
mkdir -p ./tg-data

# 3. Telegram Local Serverni ishga tushirish (Sizning ma'lumotlaringiz bilan)
echo "🚀 Local Server ishga tushmoqda..."
./telegram-bot-api \
    --api-id=33279940 \
    --api-hash=ebec3314c624540f0591ec66eb021ca0 \
    --local \
    --http-port=8081 \
    --dir=./tg-data &

# Server yuklanishi uchun biroz kutamiz
sleep 5

# 4. Node.js botni ishga tushirish
echo "🤖 Bot ishga tushmoqda..."
node bot.js