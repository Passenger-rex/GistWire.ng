import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
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

    // Verify image is actually an image, otherwise fallback
    try {
      const imgRes = await fetch(image);
      const contentType = imgRes.headers.get('content-type');
      if (!imgRes.ok || !contentType?.startsWith('image/')) {
        image = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&h=630&fit=crop';
      }
    } catch (e) {
      image = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&h=630&fit=crop';
    }
    
    const words = title.split(' ').filter(Boolean);
    const punchyHeadline = words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');

    if (!fontBuffer) {
      try {
        const fontResponse = await fetch('https://raw.githubusercontent.com/googlefonts/roboto/main/src/hinted/Roboto-Bold.ttf');
        fontBuffer = await fontResponse.arrayBuffer();
      } catch (e) {
        console.error("Failed to load remote font", e);
        // Provide a dummy buffer if failed, though it will error in Satori
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
                  opacity: 0.8
                }
              }
            },
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'rgba(0, 0, 0, 0.85)',
                  padding: '50px 80px',
                  borderRadius: '24px',
                  maxWidth: '85%',
                  alignItems: 'center',
                  textAlign: 'center',
                  border: '2px solid rgba(255,255,255,0.15)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                },
                children: [
                  {
                    type: 'h1',
                    props: {
                      style: {
                        fontSize: '84px',
                        fontFamily: 'Roboto',
                        fontWeight: 600,
                        color: 'white',
                        lineHeight: 1.1,
                        margin: '0 0 24px 0',
                        textAlign: 'center'
                      },
                      children: punchyHeadline
                    }
                  },
                  {
                    type: 'p',
                    props: {
                      style: {
                        fontSize: '36px',
                        fontFamily: 'Roboto',
                        color: '#00a85a',
                        margin: 0,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '4px',
                        textAlign: 'center'
                      },
                      children: cta
                    }
                  }
                ]
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

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.status(200).send(pngBuffer);
  } catch (error) {
    console.error('OG Image Generation Error:', error);
    res.status(500).send('Error generating image');
  }
}
