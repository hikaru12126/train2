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

  const form = new formidable.IncomingForm();

  form.parse(req, (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: 'ファイル解析エラー' });
      return;
    }
    const userInstruction = fields.userInstruction;
    const file = files.csv;
    if (!file || !file.filepath) {
      res.status(400).json({ error: 'CSVファイルがありません' });
      return;
    }

    const results = [];
    fs.createReadStream(file.filepath)
      .pipe(csvParser())
      .on('data', (row) => results.push(row))
      .on('end', () => {
        // ★ここでChatGPT APIを呼ぶ処理を追加可能
        // 例: CSVを元にGPT回答を作る
        // ここでは仮に件数・カラム名を表示
        res.status(200).json({
          result: `CSV行数: ${results.length}\n1行目: ${JSON.stringify(results[0])}\nユーザー指示: ${userInstruction}`,
        });
      })
      .on('error', () => {
        res.status(500).json({ error: 'CSVパースエラー' });
      });
  });
}
