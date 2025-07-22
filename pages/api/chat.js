import formidable from 'formidable';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import fs from 'fs';
import { OpenAI } from 'openai';

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: 'ファイル解析エラー' });
      return;
    }

    const userInstruction = fields?.userInstruction?.toString?.() || '';
    const fileRaw = files?.csv;
    const file = Array.isArray(fileRaw) ? fileRaw[0] : fileRaw;
    const filepath = file.filepath || file.path;

    let buffer = null;
    if (filepath && fs.existsSync(filepath)) {
      buffer = fs.readFileSync(filepath);
    }

    if (!buffer || buffer.length === 0) {
      res.status(400).json({ error: 'CSVファイルがありませんB' });
      return;
    }

    // CSV全データを配列で
    const results = [];
    await new Promise((resolve, reject) => {
      Readable.from(buffer)
        .pipe(csvParser())
        .on('data', row => results.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    // 入力データをまとめてAIに送る（CSV行数多い時は先頭数行だけを送る工夫推奨）
    const tableSample =
      results.length > 10
        ? results.slice(0, 10)
        : results;
    const tableText = tableSample
      .map(row => JSON.stringify(row)).join('\n');

    // AIへのプロンプト（グラフJSONの指示を追加！）
    const prompt = `
あなたは交通データ解析エキスパートです。
下記は速度データCSVのサンプルです（ヘッダーは1行目）。
--- CSVサンプル ---
${tableText}
---
このデータ全体を使って、ユーザー指示
「${userInstruction}」
について
1. 日本語で要約や傾向、平均速度など解説し
2. 次にVega-Lite形式のグラフ定義(JSONのみ)も必ず以下のように出力してください。

---BEGIN VEGA---
（ここにVega-Lite JSONを出力）
---END VEGA---

必ずVega-Lite定義部分はJSON形式で「---BEGIN VEGA---」と「---END VEGA---」の間に記載してください。
`;

    try {
      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "あなたは交通データの専門家です。" },
          { role: "user", content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.2,
      });

      const aiText = chatCompletion.choices?.[0]?.message?.content || 'AI応答なし';
      res.status(200).json({ result: aiText });
    } catch (apiError) {
      res.status(500).json({ error: 'OpenAI API連携エラー' });
    }
  });
}
