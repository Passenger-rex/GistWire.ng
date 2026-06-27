import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

let fontBuffer: ArrayBuffer | null = null;

export async function generateOgImage(req: any, res: any) {
  try {
    const title = req.query.title as string || 'GistWire News';
    const cta = req.query.cta as string || 'Read Full Story →';
    let image = req.query.image as string || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&h=630&fit=crop';
    
    // Fix relative image URLs
    if (image.startsWith('/')) {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      const host = req.headers.host || 'localhost:3000';
      image = `${protocol}://${host}${image}`;
    }

    if (image.includes('unsplash.com')) {
      if (!image.includes('fm=')) {
        image += '&fm=jpg';
      }
    } else {
      // Ensure the image is JPEG and resized to fit the OG dimensions perfectly
      // This solves issues with WebP/AVIF images not being supported by Satori
      image = `https://wsrv.nl/?url=${encodeURIComponent(image)}&output=jpg&w=1200&h=630&fit=cover`;
    }

    // Verify image is actually an image, otherwise fallback
    try {
      const imgRes = await fetch(image);
      const contentType = imgRes.headers.get('content-type');
      if (!imgRes.ok || !contentType?.startsWith('image/')) {
        image = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&h=630&fit=crop&fm=jpg';
      } else {
        const buffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        image = `data:${contentType};base64,${base64}`;
      }
    } catch (e) {
      image = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&h=630&fit=crop&fm=jpg';
    }
    
    const words = title.split(' ').filter(Boolean);
    const punchyHeadline = words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');

    if (!fontBuffer || fontBuffer.byteLength < 1000) {
      try {
        const fontResponse = await fetch('https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Bold.ttf');
        if (!fontResponse.ok) throw new Error('Failed to fetch font');
        fontBuffer = await fontResponse.arrayBuffer();
      } catch (e) {
        console.error("Failed to load remote font", e);
        fontBuffer = new ArrayBuffer(0);
      }
    }

    const svg = await satori(
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            height: '100%',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            backgroundColor: '#111',
          },
          children: [
            {
              type: 'img',
              props: {
                src: image,
                style: {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: 1
                }
              }
            }
          ]
        }
      },
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Roboto',
            data: fontBuffer,
            weight: 600,
            style: 'normal',
          },
        ],
      }
    );

    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: 1200
      }
    });
    
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // Compress to JPEG to reduce file size to < 1 MB
    const jpegBuffer = await sharp(pngBuffer)
      .jpeg({ quality: 80, force: true })
      .toBuffer();

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.status(200).send(jpegBuffer);
  } catch (error) {
    console.error('OG Image Generation Error:', error);
    res.status(500).send('Error generating image');
  }
}
