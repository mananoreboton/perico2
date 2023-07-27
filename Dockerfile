# FROM hypriot/rpi-node
FROM node:18

RUN apt-get update && apt-get install -y --no-install-recommends alsa-utils && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

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

# Bundle app source
COPY . .

EXPOSE 8080
CMD [ "node", "server.js" ]