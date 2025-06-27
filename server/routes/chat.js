const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // uploadsディレクトリが必要
const { parse: csvParse } = require('csv-parse/sync');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

router.post('/chat', upload.single('csv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSVファイルが見つかりません' });
    }
    // ファイル読み込み
    const fileBuffer = await fs.promises.readFile(req.file.path);
    const records = csvParse(fileBuffer, { columns: true });

    // 最初の30行だけサンプルとして利用
    const columnDesc = Object.keys(records[0] || {})
      .map(k => `・${k}：${k}の内容`)
      .join('\n');

    const prompt =
`【カラム説明】
${columnDesc}

【CSVデータ（抜粋）】
${JSON.stringify(records.slice(0, 30), null, 2)}

【依頼内容】
${req.body.userInstruction}
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

    // ファイル削除（clean up）
    fs.unlink(req.file.path, () => {});

    res.status(200).json({ result: response.data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;