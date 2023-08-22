Execution:

- docker build . -t borabora/perico2
- docker-compose up -d

Local development:

- Download voices in the voices folder (See Dockerfile)
- Download proper version of Piper (See Dockerfile)

Troubleshooting:

- ALSA lib confmisc.c:165:(snd_config_get_card) Cannot get card index for

1 Set a proper value for plughw:0 in speakCmd
2 privileged: true i s missing in docker-compose.yml file
