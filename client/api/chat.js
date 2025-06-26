// client/api/chat.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // まずはリクエスト受信テストだけ
  res.status(200).json({ result: 'API受信テスト：Vercelサーバーレス関数から返しています' });
}
