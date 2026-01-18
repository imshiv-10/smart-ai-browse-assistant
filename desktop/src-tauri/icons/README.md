# Desktop App Icons

Before building for production, you need to generate proper app icons.

## Steps:

1. Create a high-resolution icon (1024x1024 PNG recommended)

2. Use Tauri's icon generator:
   ```bash
   npm run tauri icon path/to/your-icon.png
   ```

This will generate:
- 32x32.png
- 128x128.png
- 128x128@2x.png
- icon.icns (macOS)
- icon.ico (Windows)
- icon.png (Tray icon)

## Quick Icon Generation (macOS)

If you have ImageMagick installed:
```bash
# Create a simple placeholder icon
convert -size 1024x1024 xc:#3b82f6 \
  -fill white -gravity center \
  -pointsize 400 -annotate 0 "SB" \
  icon.png

npm run tauri icon icon.png
```

## Online Tools

You can also use online tools like:
- https://icon.kitchen/
- https://realfavicongenerator.net/
