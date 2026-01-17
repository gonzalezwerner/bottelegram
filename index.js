const { Telegraf, Markup } = require('telegraf');
const { spawn } = require('child_process');
const http = require('http');

// --- CONFIGURACIÓN ---
const BOT_TOKEN = '8330509344:AAEwcMrRAkiwuSAaNGQdnLt1Dc3UsLqj2qo'; // <--- PEGA TU TOKEN
const IMAGEN_BIENVENIDA = 'https://i.imgur.com/8eGurgX.png'; // Puedes cambiar este link por la imagen que quieras

const bot = new Telegraf(BOT_TOKEN);

// --- SERVIDOR KEEPALIVE (Para Render) ---
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot activo 💅');
});
server.listen(process.env.PORT || 3000);

// --- 1. COMANDO START CON ESTILO ---
bot.start((ctx) => {
    // Enviamos una foto en lugar de solo texto
    ctx.replyWithPhoto(IMAGEN_BIENVENIDA, {
        caption: `<b>¡Hola, ${ctx.from.first_name}! 👋</b>\n\n` +
                 `Soy tu asistente de descargas personal.\n` +
                 `🎥 <i>TikTok, Facebook, Instagram, YouTube</i>\n\n` +
                 `👇 <b>¿Cómo funciono?</b>\n` +
                 `Simplemente envíame el enlace del video y yo haré el resto.`,
        parse_mode: 'HTML', // Permite usar negritas y cursivas
        ...Markup.inlineKeyboard([
            [Markup.button.url('🛠 Soporte / Creador', 'https://t.me/tu_usuario')], // Botón con link
            [Markup.button.callback('📚 Ver Ayuda', 'help_btn')] // Botón que hace una acción
        ])
    });
});

// --- ACCIÓN DEL BOTÓN DE AYUDA ---
bot.action('help_btn', (ctx) => {
    ctx.reply('💡 <b>Ayuda Rápida:</b>\n\nSolo copia el link del video (ej: https://tiktok.com/...) y pégalo aquí en el chat. No necesitas escribir comandos.', { parse_mode: 'HTML' });
});

// --- 2. MANEJO DE MENSAJES CON FEEDBACK VISUAL ---
bot.on('text', async (ctx) => {
    const url = ctx.message.text.trim();

    if (!url.startsWith('http')) {
        return ctx.reply('⚠️ <b>Enlace no válido.</b> Asegúrate de enviar un link que empiece por http.', { parse_mode: 'HTML' });
    }

    // Enviamos un mensaje inicial que vamos a ir editando para crear efecto de carga
    const msg = await ctx.reply('🔎 <i>Analizando enlace...</i>', { parse_mode: 'HTML' });

    try {
        // Efecto visual: Cambiamos el texto para que parezca que "piensa"
        setTimeout(() => {
            try { ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, '🚀 <b>Descargando video...</b>', { parse_mode: 'HTML' }); } catch (e) {}
        }, 1500);

        // --- LÓGICA DE DESCARGA (IGUAL QUE ANTES) ---
        const args = [
            '--format', 'best[ext=mp4]/best',
            '--output', '-',
            '--quiet',
            '--no-warnings',
            '--no-playlist',
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            url
        ];

        const ytDlpProcess = spawn('yt-dlp', args);

        // Subida del video
        await ctx.replyWithVideo({ source: ytDlpProcess.stdout }, { 
            caption: '✨ <b>Aquí tienes tu video</b>\nDownloaded by @TuBotName', 
            parse_mode: 'HTML',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('🗑 Borrar Video', 'delete_video')] // Botón útil para limpiar chat
            ])
        });

        // Borrar el mensaje de "cargando" cuando termine
        await ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id);

    } catch (error) {
        console.error(error);
        await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, '❌ <b>Error:</b> No se pudo descargar. Verifica que el video sea público.', { parse_mode: 'HTML' });
    }
});

// --- ACCIÓN PARA BORRAR EL VIDEO (Limpieza) ---
bot.action('delete_video', (ctx) => {
    ctx.deleteMessage(); // Borra el mensaje donde está el botón (el video)
});

// --- LANZAMIENTO ---
bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
