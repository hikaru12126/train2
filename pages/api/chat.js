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

// 環境変数にOPENAI_API_KEYをセットしておく
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  console.log('=== [DEBUG] API invoked ===');
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    console.log('=== [DEBUG] form.parse called ===');
    if (err) {
      console.log('[DEBUG] ファイル解析エラー:', err);
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
      console.log('[DEBUG] バッファ取得成功・サイズ:', buffer.length);
    }

    if (!buffer || buffer.length === 0) {
      console.log('[DEBUG] CSVファイルがありませんB: buffer未取得');
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
    console.log('[DEBUG] CSVパース完了: ', results.length, '行');

    // 入力データをまとめてAIに送る（CSV行数多い時は先頭数行だけを送る工夫推奨）
    const tableSample =
      results.length > 10
        ? results.slice(0, 10)
        : results;
    const tableText = tableSample
      .map(row => JSON.stringify(row)).join('\n');

    // AIへのプロンプト
    const prompt = `
あなたは交通データ解析エキスパートです。
下記は速度データCSVのサンプルです（ヘッダーは1行目）。
--- CSVサンプル ---
${tableText}
--- 
このデータ全体を使って、ユーザー指示
「${userInstruction}」
へ自然言語で返答・要約・計算してください。
サマリーには平均速度や傾向も日本語で含めてください。
`;

    // OpenAI API呼び出し
    try {
      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // GPT-4使う場合は "gpt-4o" など
        messages: [
          { role: "system", content: "あなたは交通データの専門家です。" },
          { role: "user", content: prompt }
        ],
        max_tokens: 600,
        temperature: 0.2,
      });

      const aiText = chatCompletion.choices?.[0]?.message?.content || 'AI応答なし';
      res.status(200).json({ result: aiText });
    } catch (apiError) {
      console.error('[DEBUG] OpenAI APIエラー:', apiError);
      res.status(500).json({ error: 'OpenAI API連携エラー' });
    }
  });
}
