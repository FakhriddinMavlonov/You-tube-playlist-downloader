# 1. Telegram Bot API builder (bu qatlam o'zgarmaydi)
FROM alpine:latest as builder
RUN apk add --no-cache git g++ make cmake gperf openssl-dev zlib-dev linux-headers
RUN git clone --recursive https://github.com/tdlib/telegram-bot-api.git && \
    cd telegram-bot-api && \
    mkdir build && \
    cd build && \
    cmake -DCMAKE_BUILD_TYPE=Release .. && \
    cmake --build . --target install

# 2. Asosiy ishchi muhit
FROM node:22-alpine

# Python va boshqa kerakli paketlarni o'rnatish
RUN apk add --no-cache bash ffmpeg openssl libstdc++ python3 py3-pip

# Telegram serverini builder'dan nusxalash
COPY --from=builder /usr/local/bin/telegram-bot-api /usr/local/bin/telegram-bot-api

WORKDIR /app

# npm install xatosini oldini olish uchun python yo'lini ko'rsatamiz
ENV PYTHON=/usr/bin/python3

COPY package*.json ./
RUN npm install

COPY . .
RUN chmod +x start.sh

EXPOSE 10000

CMD ["bash", "start.sh"]