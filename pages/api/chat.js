import formidable from 'formidable';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  // formidableをバッファで受ける設定
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: 'ファイル解析エラー' });
      return;
    }
    const userInstruction = fields.userInstruction?.toString() || '';
    const file = files.csv;

    // formidable v2以降: file._writeStream.buffersでバッファ取得
    let buffer =
      file && file._writeStream && file._writeStream.buffers
        ? Buffer.concat(file._writeStream.buffers)
        : null;

    if (!buffer || buffer.length === 0) {
      res.status(400).json({ error: 'CSVファイルがありません' });
      return;
    }

    // バッファ→ReadableでcsvParserに渡す
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
