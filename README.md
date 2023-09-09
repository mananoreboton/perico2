
## Perico 2 ##

It speaks out the messages it receives over MQTT and HTTP.  
It is implemented as a docker-compose service with volumes to avoid reading/writing to the OS hard drive.  

### Setting up:

- Be sure you have docker (20.10+), docker-compose, node (v20.3.1) and npm (9.6.7) installed

- Download Javascript dependencies:
  > npm -i

- Configure environment variables
  > cp .env_example .env  
    - and replace the values in the .env file.

- Download voices (Ideally 'volumes' is a folder on an external hard drive)
  > mkdir -p volumes/perico2/voices  
  > ln -s volumes/perico2/voices voices  
  > cd voices
  > curl https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/libritts/high/en_US-libritts-high.onnx.json -o en_US-libritts-high.onnx.json  
  > curl -LJO https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/libritts/high/en_US-libritts-high.onnx  
  > curl https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/ryan/high/en_US-ryan-high.onnx.json -o en_US-ryan-high.onnx.json  
  > curl -LJO https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/ryan/high/en_US-ryan-high.onnx  
  > curl https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx.json -o es_ES-mls_10246-low.onnx.json  
  > curl -LJO https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_ES/mls_10246/low/es_ES-mls_10246-low.onnx  
  > curl https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx.json -o es_ES-sharvard-medium.onnx.json  
  > curl -LJO https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx  
  > cd ..
  
- Download proper version of [Piper](https://github.com/rhasspy/piper) 
  > cd volumes/perico2
    - **ARM**
  > curl -LJO https://github.com/rhasspy/piper/releases/download/v1.1.0/piper_arm64.tar.gz
  > tar -xzf piper_arm64.tar.gz
    - **AMD64**:
  > curl -LJO https://github.com/rhasspy/piper/releases/download/v1.1.0/piper_amd64.tar.gz
  > tar -xzf piper_amd64.tar.gz  
    - back to project's root folder.
  > cd ../../
  > ln -s volumes/perico2/piper piper

- Download the songs you want to have available
  > mkdir -p volumes/perico2/songs  
  > ln -s volumes/perico2/songs songs
  > cd songs
    - For example:
  > curl -LJO https://freetestdata.com/wp-content/uploads/2021/09/Free_Test_Data_1MB_MP3.mp3
    - back to project's root folder.
  > cd ..

### Building and starting container:

- > docker build . -t borabora/perico2
- > docker-compose up -d

### Troubleshooting:

- ALSA lib confmisc.c:165:(snd_config_get_card) Cannot get card index for.

  1. Set a proper value for ALSA_INTERFACE (for example, plughw:0 in the speakCmd variable).
  2. privileged: true is missing in docker-compose.yml file.


