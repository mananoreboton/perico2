### Execution:

- ln -s volumes/perico2/voices/ voices
- docker build . -t borabora/perico2
- docker-compose up -d

### Local development:

- Download voices and copy them to volumes/perico2/voices (See comments in the Dockerfile file)
- Download proper version of Piper (See Dockerfile)

### Troubleshooting:

- ALSA lib confmisc.c:165:(snd_config_get_card) Cannot get card index for

1 Set a proper value for ALSA_INTERFACE (for example, plughw:0 in the speakCmd variable)
2 privileged: true is missing in docker-compose.yml file
