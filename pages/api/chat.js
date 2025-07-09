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
  console.log('=== [DEBUG] API invoked ===');
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    console.log('=== [DEBUG] form.parse called ===');
    console.log('[DEBUG] err:', err);
    console.log('[DEBUG] fields:', fields);
    console.log('[DEBUG] files:', files);

    if (err) {
      console.log('[DEBUG] ファイル解析エラー:', err);
      res.status(500).json({ error: 'ファイル解析エラー' });
      return;
    }

    // ファイル・フィールドのnull/undefinedチェック
    if (!fields) {
      console.log('[DEBUG] fieldsがnull/undefinedです');
    }
    if (!files) {
      console.log('[DEBUG] filesがnull/undefinedです');
    }

    // フィールド値
    const userInstruction = fields?.userInstruction?.toString?.() || '';
    console.log('[DEBUG] userInstruction:', userInstruction);

    // ファイル取得・配列対応
    const fileRaw = files?.csv;
    const file = Array.isArray(fileRaw) ? fileRaw[0] : fileRaw;
    console.log('[DEBUG] fileRaw:', fileRaw);
    console.log('[DEBUG] file:', file);

    if (!file) {
      console.log('[DEBUG] ファイル(csv)がありません');
      res.status(400).json({ error: 'CSVファイルがありませんA' });
      return;
    }

    // パス名対応 （v2: filepath, v1: path）
    const filepath = file.filepath || file.path;
    console.log('[DEBUG] filepath:', filepath);

    let buffer = null;
    if (filepath && fs.existsSync(filepath)) {
      buffer = fs.readFileSync(filepath);
      console.log('[DEBUG] バッファ取得成功・サイズ:', buffer.length);
    } else if (file.toBuffer) {
      buffer = await file.toBuffer();
      console.log('[DEBUG] toBufferによる取得・サイズ:', buffer.length);
    } else {
      console.log('[DEBUG] filepathもtoBufferも無効です');
    }

    if (!buffer || buffer.length === 0) {
      console.log('[DEBUG] CSVファイルがありませんB: buffer未取得');
      res.status(400).json({ error: 'CSVファイルがありませんB' });
      return;
    }

    // CSVパース
    const results = [];
    Readable.from(buffer)
      .pipe(csvParser())
      .on('data', (row) => {
        console.log('[DEBUG] CSV行:', row);
        results.push(row);
      })
      .on('end', () => {
        console.log('[DEBUG] CSVパース完了 行数:', results.length);
        res.status(200).json({
          result: `CSV行数: ${results.length}\n1行目: ${JSON.stringify(results[0])}\nユーザー指示: ${userInstruction}`,
        });
      })
      .on('error', (parseErr) => {
        console.log('[DEBUG] CSVパースエラー:', parseErr);
        res.status(500).json({ error: 'CSVパースエラー' });
      });
  });
}
