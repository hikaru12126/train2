// routes/chat.js
const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const axios = require('axios');
const router = express.Router();

const upload = multer();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

router.post('/chat', upload.single('csv'), async (req, res) => {
  try {
    const { userInstruction } = req.body;
    const csvFile = req.file;
    if (!csvFile) {
      return res.status(400).json({ error: 'CSVファイルがありません' });
    }
    const records = parse(csvFile.buffer, { columns: true });
    // --- カラム説明自動生成（必要なら編集推奨） ---
    const columnDesc = Object.keys(records[0])
      .map(k => `・${k}：${k}の内容`)
      .join('\n');

    // --- 改善されたプロンプトを作成 ---
    const prompt = `


【カラム説明】
${columnDesc}

【CSVデータ（抜粋）】
${JSON.stringify(records.slice(0, 30), null, 2)}

【依頼内容】
${userInstruction}


`;

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
    res.json({ result: response.data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;