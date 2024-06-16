
## Perico 3 ##

It speaks out the messages it receives over MQTT and HTTP.  
It is implemented as a docker-compose service with volumes to avoid reading/writing to the OS hard drive.  

### Setting up:

- Be sure you have docker (20.10+), docker-compose, node (18.19.1) and npm installed

- Download Javascript dependencies:
  > npm install

- Configure environment variables
  > cp .env_example .env  
    - and replace the values in the .env file.

- Optional: Download the resources so you can have a local cache
  > node resource_downloader.js

### Run:

- Execute
  > node server.js

### Building and starting Docker container:

- > docker build . -t borabora/perico3
- > docker-compose up -d
or  
- > docker compose up -d

### Troubleshooting:

- ALSA lib confmisc.c:165:(snd_config_get_card) Cannot get card index for.

  1. Set a proper value for ALSA_INTERFACE (for example, plughw:0 in the speakCmd variable).
  2. privileged: true is missing in docker-compose.yml file.


