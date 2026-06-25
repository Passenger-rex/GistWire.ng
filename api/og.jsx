import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || 'GistWire News';
    const cta = searchParams.get('cta') || 'Read Full Story →';
    const image = searchParams.get('image') || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167';

    // Extract a 4-word punchy headline from the title
    const words = title.split(' ').filter(Boolean);
    const punchyHeadline = words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            backgroundColor: '#111',
          }}
        >
          <img 
            src={image}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.8
            }}
          />
          <div style={{
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
          }}>
            <h1 style={{
              fontSize: '84px',
              fontFamily: 'sans-serif',
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.1,
              margin: '0 0 24px 0',
              textAlign: 'center'
            }}>
              {punchyHeadline}
            </h1>
            <p style={{
              fontSize: '36px',
              fontFamily: 'sans-serif',
              color: '#00a85a',
              margin: 0,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '4px',
              textAlign: 'center'
            }}>
              {cta}
            </p>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e) {
    console.error(e.message);
    return new Response('Failed to generate image', { status: 500 });
  }
}
