import fs from 'fs';
import path from 'path';

async function downloadTTF() {
  const url = 'https://raw.githubusercontent.com/googlefonts/roboto/main/src/hinted/Roboto-Bold.ttf';
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(path.join(process.cwd(), 'src', 'assets', 'inter-bold.ttf'), Buffer.from(buffer));
  console.log('TTF/OTF saved successfully!');
}

downloadTTF();
