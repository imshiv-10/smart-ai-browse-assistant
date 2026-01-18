#!/usr/bin/env python3
import struct
import zlib
import os

def create_png(width, height, filename):
    def png_chunk(chunk_type, data):
        chunk_len = struct.pack('>I', len(data))
        chunk_data = chunk_type + data
        checksum = struct.pack('>I', zlib.crc32(chunk_data) & 0xffffffff)
        return chunk_len + chunk_data + checksum

    # PNG signature
    signature = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk - color type 6 = RGBA
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr = png_chunk(b'IHDR', ihdr_data)
    
    # Image data (blue color #3b82f6 with full alpha)
    raw_data = b''
    for y in range(height):
        raw_data += b'\x00'  # filter byte
        for x in range(width):
            raw_data += bytes([59, 130, 246, 255])  # RGBA
    
    compressed = zlib.compress(raw_data)
    idat = png_chunk(b'IDAT', compressed)
    
    # IEND chunk
    iend = png_chunk(b'IEND', b'')
    
    with open(filename, 'wb') as f:
        f.write(signature + ihdr + idat + iend)
    print(f'Created {filename}')

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    create_png(32, 32, '32x32.png')
    create_png(128, 128, '128x128.png')
    create_png(256, 256, '128x128@2x.png')
    create_png(512, 512, 'icon.png')
    print('Done! All icons created.')
