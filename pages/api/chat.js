// /pages/api/chat.js
import formidable from 'formidable';
import fs from 'fs';
import csvParser from 'csv-parser';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // v2以降はこれでOK
  const form = formidable();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: 'ファイル解析エラー' });
      return;
    }
    const userInstruction = fields.userInstruction;
    const file = files.csv;

    // formidable v2以降: file.filepath でパスが取得可能
    if (!file || !file.filepath) {
      res.status(400).json({ error: 'CSVファイルがありません' });
      return;
    }

    const results = [];
    try {
      fs.createReadStream(file.filepath)
        .pipe(csvParser())
        .on('data', (row) => results.push(row))
        .on('end', () => {
          res.status(200).json({
            result: `CSV行数: ${results.length}\n1行目: ${JSON.stringify(results[0])}\nユーザー指示: ${userInstruction}`,
          });
        })
        .on('error', () => {
          res.status(500).json({ error: 'CSVパースエラー' });
        });
    } catch (e) {
      res.status(500).json({ error: 'サーバーエラー' });
    }
  });
}
