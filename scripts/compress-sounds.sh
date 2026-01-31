#!/bin/bash

# Compress large audio files to ~5MB target size
# Uses 64kbps bitrate and trims to 10 minutes max for ambient sounds

SOUNDS_DIR="assets/sounds"
BACKUP_DIR="assets/sounds/originals"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Files to compress (larger than 10MB)
FILES=(
  "Animals.mp3"
  "Cricket.mp3"
  "Forest.mp3"
  "Heavy-Thunderstorm.mp3"
  "Ocean-Sounds.mp3"
  "Rain.mp3"
  "rolling-wave.mp3"
  "Stream.mp3"
  "wind.mp3"
)

for file in "${FILES[@]}"; do
  if [ -f "$SOUNDS_DIR/$file" ]; then
    echo "Compressing $file..."
    
    # Backup original
    cp "$SOUNDS_DIR/$file" "$BACKUP_DIR/$file"
    
    # Compress: 64kbps, mono, trim to 5 minutes max
    ffmpeg -y -i "$BACKUP_DIR/$file" \
      -t 300 \
      -ac 1 \
      -b:a 64k \
      "$SOUNDS_DIR/${file%.mp3}-compressed.mp3" 2>/dev/null
    
    # Replace original with compressed
    mv "$SOUNDS_DIR/${file%.mp3}-compressed.mp3" "$SOUNDS_DIR/$file"
    
    echo "Done: $file"
  fi
done

echo ""
echo "Compression complete! New sizes:"
ls -lh "$SOUNDS_DIR"/*.mp3
