import { get } from 'https';

export const translateText = (text: string, target: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encoded}`;

    get(url, res => {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`Translate API error: ${res.statusCode}`));
      }

      let rawData = '';
      res.on('data', chunk => rawData += chunk);

      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData) as [Array<[string, string]>];
          if (!parsed[0]) return reject(new Error('Invalid response format'));

          const raw = parsed[0].map(t => t[0]).join('');
          const lower = raw.toLowerCase();
          resolve(lower.charAt(0).toUpperCase() + lower.slice(1));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
};