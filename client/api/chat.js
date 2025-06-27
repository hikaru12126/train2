const { IncomingForm } = require('formidable');
const { parse: csvParse } = require('csv-parse/sync');
const axios = require('axios');
const fs = require('fs');

// Vercel Serverless Functions用の設定（bodyParser無効化）
module.exports.config = {
  api: {
    bodyParser: false, // form-data用
  },
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const form = new IncomingForm();

  // formidableでmultipart/form-dataをパース
  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: 'form-data parse error' });
      return;
    }

    try {
      const userInstruction = fields.userInstruction;
      const csvFile = files.csv;

      if (!csvFile) {
        res.status(400).json({ error: 'CSVファイルがありません' });
        return;
      }

      // formidableの場合、ファイルはpathで渡されます
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
};