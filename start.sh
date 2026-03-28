#!/bin/bash

# 1. Ma'lumotlar papkasini yaratish
mkdir -p ./tg-data

# 2. Local Serverni ishga tushirish (npx orqali)
echo "🚀 Local Server ishga tushmoqda..."
npx @grammyjs/botapi-bin \
    --api-id=33279940 \
    --api-hash=ebec3314c624540f0591ec66eb021ca0 \
    --local \
    --http-port=8081 \
    --dir=./tg-data &

# 3. Server to'liq yonishi uchun kutish
echo "⏳ Serverni kutmoqdamiz (20 soniya)..."
sleep 20

# 4. Botni ishga tushirish
echo "🤖 Bot ishga tushmoqda..."
node bot.js