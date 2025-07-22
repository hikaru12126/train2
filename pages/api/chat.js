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

    // --- プロンプト修正版 ---
    const prompt = `

${tableText}

「${userInstruction}」
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
      // デバッグ：AI生成内容をサーバーログに出す
      console.log('[AI GPT応答]', aiText);

      res.status(200).json({ result: aiText });
    } catch (apiError) {
      res.status(500).json({ error: 'OpenAI API連携エラー' });
    }
  });
}
