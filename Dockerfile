# FROM hypriot/rpi-node
FROM node:18

RUN apt-get update && apt-get install -y pciutils mpg123 vim alsa-utils libasound2 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY asound.conf /etc/asound.conf

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --omit=dev

RUN curl -LJO https://github.com/rhasspy/piper/releases/download/v1.1.0/piper_arm64.tar.gz
RUN tar -xzf piper_arm64.tar.gz
COPY langs ./langs
RUN curl -LJO https://freetestdata.com/wp-content/uploads/2021/09/Free_Test_Data_1MB_MP3.mp3

# Bundle app source
COPY server.js .

EXPOSE 9051
CMD [ "node", "server.js" ]
