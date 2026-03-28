#!/bin/bash

# 1. Telegram Bot API serverini yuklab olish (To'g'ri havola bilan)
echo "📥 Telegram Bot API server yuklanmoqda..."
# Eski faylni o'chiramiz agar xato yuklangan bo'lsa
rm -f telegram-bot-api

# V7.10 versiyasining to'g'ri havolasi (Linux uchun)
curl -L https://github.com/tdlib/telegram-bot-api/releases/download/v7.10/telegram-bot-api-linux-amd64 -o telegram-bot-api

# Fayl muvaffaqiyatli yuklanganini tekshirish
if [ ! -s telegram-bot-api ]; then
    echo "❌ Serverni yuklab bo'lmadi!"
    exit 1
fi

chmod +x telegram-bot-api

# 2. Ma'lumotlar papkasini yaratish
mkdir -p ./tg-data

# 3. Telegram Local Serverni ishga tushirish
echo "🚀 Local Server ishga tushmoqda..."
./telegram-bot-api \
    --api-id=33279940 \
    --api-hash=ebec3314c624540f0591ec66eb021ca0 \
    --local \
    --http-port=8081 \
    --dir=./tg-data &

# Server yuklanishi uchun 10 soniya kutamiz
sleep 10

# 4. Node.js botni ishga tushirish
echo "🤖 Bot ishga tushmoqda..."
node bot.js