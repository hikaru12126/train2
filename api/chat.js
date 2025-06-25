// /api/chat.js（Vercel サーバレスAPI Route用）
// 必要なパッケージのimport（省略せず載せています）
import { parse } from 'csv-parse/sync';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // multipart/form-data対応
  const busboy = (await import('busboy')).default;
  let userInstruction = '';
  let csvBuffer = null;

  try {
    // バスボーイでフォームデータをパース
    await new Promise((resolve, reject) => {
      const bb = busboy({ headers: req.headers });

      bb.on('file', (name, file) => {
        const chunks = [];
        file.on('data', chunk => chunks.push(chunk));
        file.on('end', () => {
          if (name === 'csv') {
            csvBuffer = Buffer.concat(chunks);
          }
        });
      });

      bb.on('field', (name, val) => {
        if (name === 'userInstruction') userInstruction = val;
      });

      bb.on('finish', resolve);
      bb.on('error', reject);

      req.pipe(bb);
    });

    if (!csvBuffer) {
      // ここに到達するときのデバッグ出力
      console.error('CSVバッファがありません');
      return res.status(400).json({ error: 'CSVファイルがありません' });
    }

    const records = parse(csvBuffer, { columns: true });

    const columnDesc = Object.keys(records[0])
      .map(k => `・${k}：${k}の内容`)
      .join('\n');

    const prompt = `
【カラム説明】
${columnDesc}

【CSVデータ（抜粋）】
${JSON.stringify(records.slice(0, 30), null, 2)}

【依頼内容】
${userInstruction}
`;

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      // ここもデバッグ出力
      console.error('OPENAI_API_KEY not set');
      return res.status(500).json({ error: 'OPENAI_API_KEY not set' });
    }
    const model = 'gpt-3.5-turbo';

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: model,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    res.status(200).json({ result: response.data.choices[0].message.content });

  } catch (err) {
    // ★ここがポイント！詳細に返し＆ログとしても出す
    console.error('APIエラー：', err, err.stack);
    res.status(500).json({
      error: err.message,
      stack: err.stack,
      name: err.name,
      ...(err.response ? { response: err.response.data } : {}),
      custom: 'この内容とstackをサポート担当に貼ってください'
    });
  }
}
