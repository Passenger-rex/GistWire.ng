import { generateOgImage } from '../ogHandler.js';

export default async function handler(req: any, res: any) {
  return generateOgImage(req, res);
}
