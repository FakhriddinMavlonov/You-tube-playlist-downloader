const ffmpeg = require('ffmpeg-static');
process.env.FFMPEG_PATH = ffmpeg;

const TelegramBot = require('node-telegram-bot-api');
const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

// --- 1. SOZLAMALAR ---
process.env.NTBA_FIX_350 = "1"; // Telegram API ogohlantirishini o'chirish
const token = '8376033041:AAGJgfPkGgHg_lx4ni3YhuY4va7HwlXEJjc';

// MUHIM: Local server manzili (start.sh dagi port bilan bir xil bo'lishi kerak)
const bot = new TelegramBot(token, { 
    polling: true,
    baseApiUrl: "http://localhost:8081" 
});

const urlStore = new Map();

// yt-dlp yo'lini aniqlash
let ytDlpPath = path.join(__dirname, 'node_modules', 'yt-dlp-exec', 'bin', 'yt-dlp' + (process.platform === 'win32' ? '.exe' : ''));
if (!fs.existsSync(ytDlpPath)) ytDlpPath = 'yt-dlp';

// --- 2. YORDAMCHI FUNKSIYALAR ---

function generateProgressBar(percent) {
    const total = 10;
    const completed = Math.round((percent / 100) * total);
    return `[${'🟩'.repeat(completed)}${'⬜'.repeat(total - completed)}] ${percent}%`;
}

// --- 3. ASOSIY LOGIKA (MESSAGE HANDLING) ---

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text && (text.includes('youtube.com/') || text.includes('youtu.be/'))) {
        const urlId = "id_" + Date.now(); 
        urlStore.set(urlId, text.trim());

        const opts = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '🎵 Audio (MP3)', callback_data: `aud_${urlId}` },
                        { text: '🎬 Video (MP4)', callback_data: `vid_${urlId}` }
                    ]
                ]
            }
        };
        bot.sendMessage(chatId, "Formatni tanlang (Local Server: 2GB gacha ruxsat):", opts);
    }
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const callbackData = query.data;
    const isVideo = callbackData.startsWith('vid_');
    const urlId = callbackData.replace(isVideo ? 'vid_' : 'aud_', '');
    const url = urlStore.get(urlId);

    if (!url) return bot.answerCallbackQuery(query.id, { text: "Link eskirgan." });

    bot.answerCallbackQuery(query.id);
    bot.deleteMessage(chatId, query.message.message_id).catch(() => {});

    // Playlist yoki bitta video ekanligini tahlil qilish
    const analyzer = spawn(ytDlpPath, ['--get-id', '--flat-playlist', url]);
    let videoIds = "";
    analyzer.stdout.on('data', (d) => videoIds += d.toString());
    
    analyzer.on('close', async () => {
        const idList = videoIds.trim().split('\n').filter(id => id.trim());
        if (idList.length === 0) return bot.sendMessage(chatId, "❌ Video topilmadi.");

        bot.sendMessage(chatId, `🚀 **${isVideo ? 'Video' : 'Audio'}** yuklash boshlandi. Jami: ${idList.length} ta.`);

        for (let i = 0; i < idList.length; i++) {
            await downloadAndSend(chatId, idList[i].trim(), i + 1, idList.length, isVideo);
        }
        urlStore.delete(urlId);
    });
});

// --- 4. YUKLASH VA YUBORISH FUNKSIYASI ---

async function downloadAndSend(chatId, videoId, current, total, isVideo) {
    return new Promise(async (resolve) => {
        // Har bir video uchun alohida vaqtinchalik papka
        const tempDir = path.resolve(__dirname, `temp_${chatId}_${Date.now()}`);
        await fs.ensureDir(tempDir);

        let statusMsg = await bot.sendMessage(chatId, `⏳ **${current}/${total} tayyorlanmoqda...**`);

        const args = isVideo 
            ? [
                `https://www.youtube.com/watch?v=${videoId}`,
                '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                '--merge-output-format', 'mp4',
                '-o', path.join(tempDir, '%(title)s.%(ext)s'),
                '--newline', '--no-warnings'
            ]
            : [
                `https://www.youtube.com/watch?v=${videoId}`,
                '--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0',
                '-o', path.join(tempDir, '%(title)s.%(ext)s'),
                '--newline', '--no-warnings'
            ];

        const downloader = spawn(ytDlpPath, args);
        let fileName = "";
        let lastUpdate = 0;

        downloader.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('Destination:')) {
                const parts = output.split('Destination: ');
                if (parts[1]) fileName = path.basename(parts[1].trim());
            }
            const match = output.match(/\[download\]\s+(\d+\.\d+)%/);
            if (match) {
                const percent = parseFloat(match[1]);
                const now = Date.now();
                if (now - lastUpdate > 2500) { // Telegramni ban qilmasligi uchun har 2.5 sekunda yangilash
                    bot.editMessageText(`📥 **${current}/${total} yuklanmoqda:**\n\`${fileName || '...'}\`\n\n${generateProgressBar(percent)}`, {
                        chat_id: chatId, message_id: statusMsg.message_id, parse_mode: 'Markdown'
                    }).catch(() => {});
                    lastUpdate = now;
                }
            }
        });

        downloader.on('close', async (code) => {
            try {
                const files = await fs.readdir(tempDir);
                const downloadedFile = files.find(f => !f.endsWith('.part') && !f.endsWith('.ytdl'));

                if (downloadedFile) {
                    const filePath = path.join(tempDir, downloadedFile);
                    const stats = fs.statSync(filePath);
                    const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);

                    await bot.editMessageText(`📤 **Yuborilmoqda... (${sizeMB} MB)**`, {
                        chat_id: chatId, message_id: statusMsg.message_id
                    }).catch(() => {});

                    // LOCAL SERVERDA: Stream o'rniga to'g'ridan-to'g'ri FILE PATH yuboriladi
                    if (isVideo) {
                        await bot.sendVideo(chatId, filePath, { caption: `✅ ${downloadedFile}` });
                    } else {
                        await bot.sendAudio(chatId, filePath, { caption: `✅ ${downloadedFile}` });
                    }
                } else {
                    bot.sendMessage(chatId, `❌ ${current}-faylda yuklash xatosi.`);
                }
            } catch (e) {
                console.error("Yuborishda xato:", e.message);
                bot.sendMessage(chatId, "⚠️ Local Server yuborishda xatolik berdi. Fayl o'ta katta yoki disk to'la.");
            } finally {
                // Tozalash
                await fs.remove(tempDir).catch(() => {});
                resolve();
            }
        });
    });
}

console.log("Bot Local Server rejimida ishga tushdi...");