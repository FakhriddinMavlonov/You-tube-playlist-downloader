const ytDlp = require('yt-dlp-exec');
const readline = require('readline');
const fs = require('fs-extra'); // Papkalarni oson o'chirish uchun
const path = require('path');
const archiver = require('archiver');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function zipDirectory(sourceDir, outPath) {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = fs.createWriteStream(outPath);

    return new Promise((resolve, reject) => {
        archive
            .directory(sourceDir, false)
            .on('error', err => reject(err))
            .pipe(stream);

        stream.on('close', () => resolve());
        archive.finalize();
    });
}

async function startProcess() {
    try {
        const playlistUrl = await askQuestion("YouTube playlist linkini kiriting: ");
        let baseDir = await askQuestion("Asosiy papka nomini kiriting (masalan, 'MeningMusiqalarim'): ");
        
        baseDir = baseDir.trim() || 'MyPlaylist';
        const sourcesDir = path.join(baseDir, 'sources');
        const zipFile = `${baseDir}.zip`;

        // 1. 'sources' papkasini yaratish
        await fs.ensureDir(sourcesDir);

        console.log(`\n[1/3] Yuklash boshlandi: ${sourcesDir}...`);
        
        // 2. Yuklab olish
        await ytDlp(playlistUrl, {
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: '0',
            output: path.join(sourcesDir, '%(title)s.%(ext)s'),
            yesPlaylist: true,
            noWarnings: true
        });

        console.log(`\n[2/3] ZIP arxiv yaratilmoqda: ${zipFile}...`);
        
        // 3. Arxivlash
        await zipDirectory(sourcesDir, zipFile);

        console.log(`\n[3/3] Vaqtinchalik fayllar tozalanmoqda...`);
        
        // 4. 'sources' va asosiy papkani o'chirish
        await fs.remove(baseDir);

        console.log(`\n✅ Hammasi tayyor! Arxiv nomi: ${zipFile}`);

    } catch (error) {
        console.error("\n❌ Xatolik yuz berdi:", error.message);
    } finally {
        rl.close();
    }
}

startProcess();