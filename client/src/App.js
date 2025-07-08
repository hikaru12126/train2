import React, { useState } from 'react';

function App() {
  const [instruction, setInstruction] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!file) {
      setResult('CSVファイルを選択してください');
      return;
    }
    setLoading(true);
    setResult('');
    try {
      const formData = new FormData();
      formData.append('csv', file);
      formData.append('userInstruction', instruction);

      // ★Vercelでは/api/chatにfetch
      const res = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data.result || data.error);
    } catch (e) {
      setResult('エラーが発生しました');
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>ChatGPT × CSV参照デモ</h2>
      <input
        type="file"
        accept=".csv"
        onChange={e => setFile(e.target.files[0])}
      /><br />
      <textarea
        value={instruction}
        onChange={e => setInstruction(e.target.value)}
        rows={5}
        cols={60}
        placeholder="指示を入力してください"
      /><br />
      <button onClick={handleSend} disabled={loading}>送信</button>
      {loading && <div>送信中...</div>}

      <div style={{ marginTop: 20 }}>
        <strong>結果:</strong>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{result}</pre>
      </div>
    </div>
  );
}

export default App;
