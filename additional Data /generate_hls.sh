#!/bin/bash

# Get the current time in the format HH:MM:SS_DD_MM_YYYY
current_time=$(date +"%H_%M_%S_%d_%m_%Y")

# Set the filename for the .m3u8 playlist using the current time
output_filename="${current_time}.m3u8"

# Run FFmpeg to create the HLS stream and save it with the dynamic filename
ffmpeg -i rtsp://admin:admin@192.168.111.49:554/unicaststream/1 -c:v libx264 -c:a aac -strict experimental \
    -f hls -hls_time 10 -hls_list_size 6 -start_number 1 "$output_filename"
