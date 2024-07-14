# FROM hypriot/rpi-node
FROM node:18

RUN apt-get update && apt-get install -y pciutils mpg123 vim alsa-utils libasound2 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY asound.conf /etc/asound.conf
# Bundle app source
COPY server.js .
COPY resource_downloader.js .
COPY .env .

# Copy songs and voices directories
COPY songs /usr/src/app/songs
COPY voices /usr/src/app/voices

# Copy all files starting with 'piper'
COPY piper* /usr/src/app/

EXPOSE 9051
CMD [ "node", "server.js" ]
