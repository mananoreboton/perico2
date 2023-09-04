# FROM hypriot/rpi-node
FROM node:18

RUN apt-get update && apt-get install -y pciutils mpg123 vim alsa-utils libasound2 && \
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
#RUN curl -LJO https://github.com/rhasspy/piper/releases/download/v1.1.0/piper_amd64.tar.gz
#RUN tar -xzf piper_amd64.tar.gz

#COPY voices ./voices
#Dowload voices or get them from your local files server
#RUN curl https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/libritts/high/en_US-libritts-high.onnx.json -o en_US-libritts-high.onnx.json
#RUN curl -LJO https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/libritts/high/en_US-libritts-high.onnx
#RUN sleep 4;
#
#RUN curl https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/ryan/high/en_US-ryan-high.onnx.json -o en_US-ryan-high.onnx.json
#RUN curl -LJO https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/ryan/high/en_US-ryan-high.onnx
#RUN sleep 4;
#
#RUN curl https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx.json -o es_ES-mls_10246-low.onnx.json
#RUN curl -LJO https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx
#RUN sleep 4;
#
#RUN curl https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx.json -o es_ES-sharvard-medium.onnx.json
#RUN curl -LJO https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx
#RUN sleep 4;

RUN curl -LJO https://freetestdata.com/wp-content/uploads/2021/09/Free_Test_Data_1MB_MP3.mp3

COPY asound.conf /etc/asound.conf
# Bundle app source
COPY server.js .

EXPOSE 9051
CMD [ "node", "server.js" ]
