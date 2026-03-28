#!/bin/bash
mkdir -p ./tg-data

# 1. Telegram Serverni ishga tushirish
telegram-bot-api \
    --api-id=33279940 \
    --api-hash=ebec3314c624540f0591ec66eb021ca0 \
    --local \
    --http-port=8081 \
    --dir=./tg-data &

sleep 10

# 2. Botni ishga tushirish
node bot.js