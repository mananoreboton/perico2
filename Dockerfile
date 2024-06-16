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

EXPOSE 9051
CMD [ "node", "server.js" ]
