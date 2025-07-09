import formidable from 'formidable';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

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

    // 最新のformidableではtoBufferで取得
    let buffer;
    if (file.toBuffer) {
      buffer = await file.toBuffer();
    } else {
      // fallback: v1系
      buffer = file && file._writeStream && file._writeStream.buffers
        ? Buffer.concat(file._writeStream.buffers)
        : null;
    }

    if (!buffer || buffer.length === 0) {
      res.status(400).json({ error: 'CSVファイルがありません2' });
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
