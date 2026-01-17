const { Telegraf, Markup } = require('telegraf');
const { spawn } = require('child_process');
const http = require('http');

// --- CONFIGURACIÓN ---
// ⚠️ IMPORTANTE: Usa tu token aquí
const BOT_TOKEN = '8330509344:AAEwcMrRAkiwuSAaNGQdnLt1Dc3UsLqj2qo'; 
const IMAGEN_BIENVENIDA = 'https://i.imgur.com/8eGurgX.png'; 

const bot = new Telegraf(BOT_TOKEN);

// --- SERVIDOR KEEPALIVE ---
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot activo 💅');
});
server.listen(process.env.PORT || 3000);

// --- COMANDO START ---
bot.start((ctx) => {
    ctx.replyWithPhoto(IMAGEN_BIENVENIDA, {
        caption: `<b>¡Hola, ${ctx.from.first_name}! 👋</b>\n\n` +
                 `Soy tu asistente de descargas personal.\n` +
                 `🎥 <i>TikTok, Facebook, Instagram, YouTube</i>\n\n` +
                 `👇 <b>¿Cómo funciono?</b>\n` +
                 `Simplemente envíame el enlace del video y yo haré el resto.`,
        parse_mode: 'HTML', 
        ...Markup.inlineKeyboard([
            [Markup.button.url('🛠 Soporte / Creador', 'https://t.me/tu_usuario')], 
            [Markup.button.callback('📚 Ver Ayuda', 'help_btn')] 
        ])
    });
});

// --- AYUDA ---
bot.action('help_btn', (ctx) => {
    ctx.reply('💡 <b>Ayuda Rápida:</b>\n\nSolo copia el link del video y pégalo aquí.', { parse_mode: 'HTML' });
});

// --- MANEJO DE MENSAJES ---
bot.on('text', async (ctx) => {
    const url = ctx.message.text.trim();

    if (!url.startsWith('http')) {
        return ctx.reply('⚠️ <b>Enlace no válido.</b>', { parse_mode: 'HTML' });
    }

    // 1. Enviamos el GIF de carga (Galaxia)
    const msg = await ctx.replyWithAnimation('https://i.postimg.cc/dt7XF9JR/galaxy-6141-256.gif', {
        caption: '⏳ <b>Procesando video...</b>',
        parse_mode: 'HTML'
    });

    // 2. INICIO DEL BLOQUE SEGURO (Aquí faltaba el try)
    try { 
        const args = [
            '--format', 'best[ext=mp4]/best',
            '--output', '-',
            '--quiet', '--no-warnings', '--no-playlist',
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            url
        ];

        const ytDlpProcess = spawn('yt-dlp', args);

        // 3. Subimos el video
        await ctx.replyWithVideo({ source: ytDlpProcess.stdout }, { 
            caption: '✨ <b>Aquí tienes tu video</b>\nDownloaded by @TuBotName', 
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('🗑 Borrar Video', 'delete_video')]
            ])
        });

        // 4. Si todo salió bien, borramos el GIF de carga
        await ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id);

    } catch (error) {
        console.error(error);
        // Si falla, editamos el GIF para decir Error
        await ctx.telegram.editMessageText(
            ctx.chat.id, 
            msg.message_id, 
            null, 
            '❌ <b>Error:</b> No se pudo descargar. Verifica que el video sea público.', 
            { parse_mode: 'HTML' }
        );
    }
});

// --- BORRAR ---
bot.action('delete_video', (ctx) => {
    ctx.deleteMessage(); 
});

// --- LAUNCH ---
bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
