import formidable from 'formidable';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: 'ファイル解析エラー' });
      return;
    }
    const userInstruction = fields.userInstruction?.toString() || '';
    const file = files.csv;

    if (!file) {
      res.status(400).json({ error: 'CSVファイルがありません' });
      return;
    }

    // formidable v2は fileは一時ファイル (file.filepath) になる
    let buffer = null;
    if (file.filepath && fs.existsSync(file.filepath)) {
      buffer = fs.readFileSync(file.filepath);
    } else if (file.toBuffer) {
      buffer = await file.toBuffer();
    }

    if (!buffer || buffer.length === 0) {
      res.status(400).json({ error: 'CSVファイルがありません3' });
      return;
    }

    const results = [];
    Readable.from(buffer)
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
  });
}
