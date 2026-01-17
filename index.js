const { Telegraf } = require('telegraf');
const { spawn } = require('child_process');
const http = require('http');

// --- CONFIGURACIÓN ---
// ⚠️ IMPORTANTE: Pega aquí el NUEVO token que te de @BotFather (el anterior ya es público)
const BOT_TOKEN = '8330509344:AAEwcMrRAkiwuSAaNGQdnLt1Dc3UsLqj2qo';

const bot = new Telegraf(BOT_TOKEN);

// --- SERVIDOR HTTP FALSO (Keep-Alive) ---
// Esto permite que Render/UptimeRobot detecten que la app está viva
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot activo y escuchando 🤖');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌍 Servidor Keep-Alive corriendo en puerto ${PORT}`);
});

// --- LÓGICA DEL BOT ---

bot.start((ctx) => {
    ctx.reply('👋 ¡Hola! Envíame un enlace de TikTok, Facebook, Instagram o YouTube y te enviaré el video.\n\n🚀 Modo: Streaming Directo (Sin guardar en disco).');
});

bot.on('text', async (ctx) => {
    const url = ctx.message.text.trim();

    // Validación básica de URL
    if (!url.startsWith('http')) {
        return ctx.reply('⚠️ Eso no parece un enlace válido.');
    }

    // Mensaje temporal
    const statusMsg = await ctx.reply('⏳ Procesando video... espere un momento.');

    try {
        console.log(`Iniciando descarga de: ${url}`);

        // Configuramos los argumentos de yt-dlp para STDOUT (Salida estándar)
        const args = [
            '--format', 'best[ext=mp4]/best', // Intentar MP4
            '--output', '-',                  // GUIÓN (-): Manda el video a la consola
            '--quiet',                        // No imprimir logs en la salida del video
            '--no-warnings',
            '--no-playlist',                  // Solo un video
            '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            url
        ];

        // Ejecutamos yt-dlp como proceso hijo
        const ytDlpProcess = spawn('yt-dlp', args);

        // Enviamos el stream directamente a Telegram
        await ctx.replyWithVideo({ source: ytDlpProcess.stdout }, {
            caption: '🎥 Aquí tienes tu video.'
        });

        // Borramos el mensaje de espera si todo salió bien
        await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id);

    } catch (error) {
        console.error('Error general:', error);
        // Intentamos editar el mensaje de espera para avisar del error
        try {
            await ctx.telegram.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                null,
                '❌ Ocurrió un error. El enlace puede ser inválido o el video muy pesado para Telegram.'
            );
        } catch (e) {
            // Si no se puede editar (ej. el usuario borró el chat), no hacemos nada
            console.log("No se pudo enviar mensaje de error al usuario.");
        }
    }
});

// --- INICIO ---
bot.launch().then(() => {
    console.log('🤖 Bot de Telegram iniciado correctamente');
}).catch((err) => {
    console.error('❌ Error al iniciar el bot:', err);
});

// Manejo de cierre elegante
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));