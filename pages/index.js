import formidable from 'formidable';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const form = new formidable.IncomingForm({ 
    multiples: false,
    keepExtensions: true,
    // VercelではfileWriteStreamHandlerでバッファ取得
    fileWriteStreamHandler: () => new require('stream').PassThrough(),
  });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'ファイル解析エラー' });
    const userInstruction = fields.userInstruction;
    const file = files.csv;

    // バッファ対応
    let buffer;
    if (file && file._writeStream && file._writeStream.buffers) {
      buffer = Buffer.concat(file._writeStream.buffers);
    } else if (file && file.filepath) {
      // ローカル開発環境ではこちら
      buffer = require('fs').readFileSync(file.filepath);
    }
    if (!buffer) {
      res.status(400).json({ error: 'CSVファイルがありません' });
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
