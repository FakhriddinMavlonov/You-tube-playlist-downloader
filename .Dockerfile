# 1. Telegram Bot API serverini yig'ish uchun builder
FROM alpine:latest as builder
RUN apk add --no-cache git g++ make cmake gperf openssl-dev zlib-dev linux-headers
RUN git clone --recursive https://github.com/tdlib/telegram-bot-api.git && \
    cd telegram-bot-api && \
    mkdir build && \
    cd build && \
    cmake -DCMAKE_BUILD_TYPE=Release .. && \
    cmake --build . --target install

# 2. Asosiy ishchi muhit (Node.js)
FROM node:22-alpine
RUN apk add --no-cache bash ffmpeg openssl libstdc++

# Telegram serverini builder'dan nusxalash
COPY --from=builder /usr/local/bin/telegram-bot-api /usr/local/bin/telegram-bot-api

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Start skriptiga ruxsat berish
RUN chmod +x start.sh

# Portni ochish (Render uchun)
EXPOSE 10000

CMD ["bash", "start.sh"]