import { generateOgImage } from './ogHandler.ts';

async function test() {
  const req = {
    protocol: 'http',
    headers: { host: 'localhost:3000', 'x-forwarded-proto': 'http' },
    query: { title: 'Test Title', image: 'https://www.gstatic.com/webp/gallery/1.webp' }
  };
  const res = {
    setHeader: () => {},
    status: (code) => ({
      send: (data) => console.log('Status', code, 'Data length:', data.length || data)
    })
  };
  await generateOgImage(req, res);
}
test();
