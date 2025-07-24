import formidable from 'formidable';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
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

    const requestAt = new Date().toISOString();

    // ユーザ指示文
    const userInstruction = fields?.userInstruction?.toString?.() || '';
    // オプション：ユーザー識別用の項目をfieldsから取得するならここ
    const userEmail = fields?.userEmail?.toString?.() || '';

    // ファイル情報取得
    const fileRaw = files?.csv;
    const file = Array.isArray(fileRaw) ? fileRaw[0] : fileRaw;
    const filepath = file?.filepath || file?.path;

    // ファイル内容取得
    let buffer = null;
    if (filepath && fs.existsSync(filepath)) {
      buffer = fs.readFileSync(filepath);
    }

    if (!buffer || buffer.length === 0) {
      res.status(400).json({ error: 'CSVファイルがありません' });
      return;
    }

    // CSVパース
    const results = [];
    try {
      await new Promise((resolve, reject) => {
        Readable.from(buffer)
          .pipe(csvParser())
          .on('data', row => results.push(row))
          .on('end', resolve)
          .on('error', reject);
      });

      // サンプルデータ生成
      const tableSample = results.length > 10 ? results.slice(0, 10) : results;
      const tableText = tableSample.map(row => JSON.stringify(row)).join('\n');

      // プロンプト文生成
      const prompt = `
以下はCSVの一部データです。指示に従い分析や解説を行い、もしグラフ生成の指示があれば、以下のフォーマットで必ずVega-Lite形式のJSONを出力してください。
グラフ部分は
---BEGIN VEGA---
{Vega-Lite JSON}
---END VEGA---
の間に必ずJSONのみ記載すること。
説明文→Vega部分の順で出力してください。

例：
---BEGIN VEGA---
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "来場者数推移グラフ",
  "data": {"values": [ {"月":"1月","来場者数":123}, {"月":"2月","来場者数":200} ]},
  "mark": "line",
  "encoding": {
    "x": {"field": "月", "type": "ordinal"},
    "y": {"field": "来場者数", "type": "quantitative"}
  }
}
---END VEGA---

${tableText}

「${userInstruction}」
`;

      try {
        const chatCompletion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "あなたは交通データの専門家であり、もしグラフ化が指示された場合はVega-Lite形式のJSONとして---BEGIN VEGA---と---END VEGA---の間に必ずJSONコードのみ出力してください。"
            },
            { role: "user", content: prompt }
          ],
          max_tokens: 1500,
          temperature: 0.2,
        });

        const aiText = chatCompletion.choices?.[0]?.message?.content || 'AI応答なし';

        // --- ログ出力 ここから ---
        const logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

        const logData = {
          time: requestAt,
          user: userEmail,
          file: file?.originalFilename || '',
          instruction: userInstruction ? userInstruction.replace(/\n/g, ' ') : '',
          aiSummary: aiText.slice(0, 500).replace(/\n/g, ' '),
        };
        const csvLine = `"${logData.time}","${logData.user}","${logData.file}","${logData.instruction.replace(/"/g, '""')}","${logData.aiSummary.replace(/"/g, '""')}"\n`;
        fs.appendFileSync(path.join(logDir, 'accesslog.csv'), csvLine, 'utf8');
        // --- ログ出力 ここまで ---

        res.status(200).json({ result: aiText });
      } catch (apiError) {
        console.error('OpenAI API ERROR:', apiError);
        res.status(500).json({
          error: 'OpenAI API連携エラー',
          detail: apiError?.toString() || JSON.stringify(apiError)
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
