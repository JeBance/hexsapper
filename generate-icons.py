#!/usr/bin/env python3
"""
HexSapper Icon Generator
Generates simple PNG icons for PWA without external dependencies.
Uses pure Python to create valid PNG files.
"""

import struct
import zlib
import os

def create_png(width, height, pixels):
    """Create a PNG file from pixel data."""
    
    def png_chunk(chunk_type, data):
        chunk_len = struct.pack('>I', len(data))
        chunk_crc = struct.pack('>I', zlib.crc32(chunk_type + data) & 0xffffffff)
        return chunk_len + chunk_type + data + chunk_crc
    
    # PNG signature
    signature = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    ihdr = png_chunk(b'IHDR', ihdr_data)
    
    # IDAT chunk (image data)
    raw_data = b''
    for y in range(height):
        raw_data += b'\x00'  # Filter type: None
        for x in range(width):
            r, g, b = pixels[x, y]
            raw_data += bytes([r, g, b])
    
    compressed = zlib.compress(raw_data, 9)
    idat = png_chunk(b'IDAT', compressed)
    
    # IEND chunk
    iend = png_chunk(b'IEND', b'')
    
    return signature + ihdr + idat + iend

def create_icon(size):
    """Create a HexSapper icon."""
    pixels = {}
    
    s = size
    cx, cy = s // 2, s // 2
    
    for x in range(s):
        for y in range(s):
            # Background gradient
            bg_ratio = (x + y) / (2 * s)
            r = int(26 + (22 - 26) * bg_ratio)
            g = int(26 + (33 - 26) * bg_ratio)
            b = int(46 + (62 - 46) * bg_ratio)
            
            # Check if inside rounded rectangle
            corner_radius = int(s * 0.12)
            in_corner = False
            
            # Check corners
            corners = [
                (corner_radius, corner_radius),
                (s - corner_radius, corner_radius),
                (corner_radius, s - corner_radius),
                (s - corner_radius, s - corner_radius)
            ]
            
            for ccx, ccy in corners:
                dx = x - ccx if x < ccx else (x - (s - ccx) if x > s - ccx else 0)
                dy = y - ccy if y < ccy else (y - (s - ccy) if y > s - ccy else 0)
                if dx != 0 or dy != 0:
                    if (x < ccx or x > s - ccx) and (y < ccy or y > s - ccy):
                        dist = ((x - ccx) ** 2 + (y - ccy) ** 2) ** 0.5
                        if dist > corner_radius:
                            in_corner = True
                            break
            
            if in_corner:
                pixels[x, y] = (26, 26, 46)
                continue
            
            # Hexagon
            hex_r = int(s * 0.25)
            hex_points = []
            for i in range(6):
                angle = (3.14159 / 3) * i - 3.14159 / 6
                hx = cx + int(hex_r * (0.866 if i % 2 else 1) * (1 if i < 3 else -1 if i > 3 else 0))
                hy = cy + int(hex_r * (1 if i % 2 == 0 else 0.866) * (-1 if i < 2 else 1 if i > 3 else 0))
                hex_points.append((hx, hy))
            
            # Simple hexagon approximation
            dx = abs(x - cx)
            dy = abs(y - cy)
            hex_dist = dx * 0.866 + dy
            
            in_hex = hex_dist < hex_r * 0.95
            
            if in_hex:
                # Hexagon gradient
                hex_ratio = y / s
                r = int(74 + (42 - 74) * hex_ratio)
                g = int(74 + (58 - 74) * hex_ratio)
                b = int(106 + (58 - 106) * hex_ratio)
                
                # Mine circle
                mine_r = int(hex_r * 0.35)
                dist_to_center = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
                
                if dist_to_center < mine_r:
                    r, g, b = 233, 69, 96  # Mine circle color
                elif dist_to_center < mine_r * 1.5:
                    # Mine spikes (simplified)
                    angle = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
                    if angle > 0:
                        spike_angle = ((x - cx) / angle) * 57.3
                        if abs(spike_angle % 45) < 10 or abs(spike_angle % 45) > 35:
                            r, g, b = 233, 69, 96
                
                pixels[x, y] = (r, g, b)
            else:
                pixels[x, y] = (r, g, b)
    
    return create_png(size, size, pixels)

def main():
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    icons_dir = os.path.join(os.path.dirname(__file__), 'icons')
    
    os.makedirs(icons_dir, exist_ok=True)
    
    print('Generating icons...\n')
    
    for size in sizes:
        png_data = create_icon(size)
        filename = os.path.join(icons_dir, f'icon-{size}.png')
        
        with open(filename, 'wb') as f:
            f.write(png_data)
        
        print(f'✓ Created icon-{size}.png ({size}x{size})')
    
    print('\n✅ All icons generated successfully!')
    print(f'📁 Icons saved to: {icons_dir}/')

if __name__ == '__main__':
    main()
