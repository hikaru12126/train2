import formidable from 'formidable';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';

console.log('API Key =', process.env.OPENAI_API_KEY);

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function handler(req, res) {
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    // ▼ デバッグ用ログ
    console.log('==== フォーム受信 ====');
    console.log('fields:', fields);
    console.log('files:', files);

    if (err) {
      res.status(500).json({ error: 'ファイル解析エラー', detail: String(err) });
      return;
    }

    // デバッグ: ファイルの実体を確認
    if (files?.csv) {
      console.log('アップロードCSVファイル実体:', files.csv);
      const file = Array.isArray(files.csv) ? files.csv[0] : files.csv;
      const exists = file?.filepath ? fs.existsSync(file.filepath) : 'no_path';
      console.log('csv.filepath:', file?.filepath, 'exists:', exists);
    }

    const requestAt = new Date().toISOString();
    const userInstruction = fields?.userInstruction?.toString?.() || '';
    const userEmail = fields?.userEmail?.toString?.() || '';
    const fileRaw = files?.csv;
    const file = Array.isArray(fileRaw) ? fileRaw[0] : fileRaw;
    const filepath = file?.filepath || file?.path;

    let buffer = null;
    if (filepath && fs.existsSync(filepath)) {
      buffer = fs.readFileSync(filepath);
    } else {
      console.log('CSVファイルパスが不正 or 存在しません:', filepath);
    }

    if (!buffer || buffer.length === 0) {
      console.log('CSVファイルがありません or バッファ長=0');
      res.status(400).json({ error: 'CSVファイルがありません' });
      return;
    }

    const results = [];
    try {
      await new Promise((resolve, reject) => {
        Readable.from(buffer)
          .pipe(csvParser())
          .on('data', row => results.push(row))
          .on('end', resolve)
          .on('error', reject);
      });

      // デバッグ: パース結果を出す
      console.log('==== CSVパース結果 ====');
      console.log(results);

      // ▼＝＝＝ここを修正＝＝＝▼
      // const tableSample = results.length > 10 ? results.slice(0, 10) : results;
      // const tableText = tableSample.map(row => JSON.stringify(row)).join('\n');
      const tableText = results.map(row => JSON.stringify(row)).join('\n');
      // ▲＝＝＝ここまで＝＝＝▲

      // ▼＝＝＝プロンプト修正＝＝＝▼
      const prompt = `
以下はCSVの一部データです。
もしグラフ生成指示がある場合は、Vega-Lite形式JSONのカラム名/フィールド名は
**「半角英字（英語）」のみ**（例："speed", "time" など）を使い、記号・単位・日本語は禁止です。また数値データは必ずnumber型で出力してください。

例: "speed", "time" など
NG例: "V[Km/h]", "速度", "時間" など

グラフ部分は
---BEGIN VEGA---
{JSONのみ}
---END VEGA---
で厳密に出力してください。

${tableText}

「${userInstruction}」
`;

      // デバッグ: プロンプト内容出力
      console.log('==== AIへ送るprompt ====');
      console.log(prompt);

      try {
        const chatCompletion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "あなたは交通データの専門家であり、もしグラフ化が指示された場合はVega-Lite形式のJSONとして---BEGIN VEGA---と---END VEGA---の間に必ずJSONコードのみ出力してください。"
            },
            { role: "user", content: prompt }
          ],
          max_tokens: 1500,
          temperature: 0.2,
        });

        const aiText = chatCompletion.choices?.[0]?.message?.content || 'AI応答なし';

        // デバッグ: AIからの返答(全文)
        console.log('==== AI回答 ====');
        console.log(aiText);

        res.status(200).json({ result: aiText });
      } catch (apiError) {
        console.error('OpenAI API ERROR:', apiError);
        res.status(500).json({
          error: 'OpenAI API連携エラー',
          detail: apiError?.message || JSON.stringify(apiError)
        });
      }
    } catch (csvError) {
      console.error('CSV PARSE ERROR:', csvError);
      res.status(500).json({
        error: 'CSV解析エラー',
        detail: csvError?.message || JSON.stringify(csvError)
      });
    }
  });
}

export default handler;
