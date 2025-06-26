import { IncomingForm } from 'formidable';
import { parse as csvParse } from 'csv-parse/sync';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: false, // form-data用
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // formidableでmultipart/form-dataをパース
  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: 'form-data parse error' });
      return;
    }

    try {
      const userInstruction = fields.userInstruction;
      const csvFile = files.csv;

      if (!csvFile) {
        return res.status(400).json({ error: 'CSVファイルがありません' });
      }

      // formidableの場合、ファイルはパスで渡されます
      const fileBuffer = await fs.promises.readFile(csvFile.filepath);
      const records = csvParse(fileBuffer, { columns: true });

      const columnDesc = Object.keys(records[0])
        .map(k => `・${k}：${k}の内容`)
        .join('\n');

      const prompt = `
【カラム説明】
${columnDesc}

【CSVデータ（抜粋）】
${JSON.stringify(records.slice(0, 30), null, 2)}

【依頼内容】
${userInstruction}
`;

      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      const model = 'gpt-3.5-turbo';

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: model,
          messages: [{ role: 'user', content: prompt }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
        }
      );

      res.status(200).json({ result: response.data.choices[0].message.content });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

import fs from 'fs';
