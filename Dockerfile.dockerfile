# 1. Usamos una imagen base ligera de Node
FROM node:18-slim

# 2. Instalamos Python3, pip y FFmpeg (Vitales para yt-dlp)
RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg && \
    apt-get clean

# 3. Instalamos yt-dlp actualizado usando pip
# El flag --break-system-packages es necesario en versiones nuevas de Debian/Ubuntu
RUN python3 -m pip install -U yt-dlp --break-system-packages

# 4. Configuración del directorio de trabajo
WORKDIR /app

# 5. Copiamos y e instalamos dependencias de Node
COPY package*.json ./
RUN npm install

# 6. Copiamos el resto del código
COPY . .

# 7. Comando de arranque
CMD ["node", "index.js"]