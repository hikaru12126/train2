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
    <div className="futuristic-bg">
      <div className="futuristic-container">
        <h2 className="futuristic-title">ChatGPT × CSV参照デモ</h2>
        <input
          type="file"
          accept=".csv"
          onChange={e => setFile(e.target.files[0])}
          className="futuristic-input"
        /><br />
        <textarea
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          rows={5}
          cols={60}
          placeholder="指示を入力してください"
          className="futuristic-textarea"
        /><br />
        <button onClick={handleSend} disabled={loading} className="futuristic-button">
          送信
        </button>
        {loading && <div className="futuristic-loading">送信中...</div>}

        <div className="futuristic-result">
          <strong>結果:</strong>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{result}</pre>
        </div>
      </div>
      <style>{`
        .futuristic-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f2027 0%, #2c5364 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .futuristic-container {
          background: rgba(30, 40, 60, 0.95);
          border-radius: 20px;
          box-shadow: 0 0 40px #00ffe7, 0 0 10px #2c5364 inset;
          padding: 40px 32px;
          max-width: 600px;
          width: 100%;
        }
        .futuristic-title {
          color: #00ffe7;
          font-family: 'Orbitron', 'Segoe UI', sans-serif;
          font-size: 2rem;
          text-align: center;
          margin-bottom: 32px;
          letter-spacing: 2px;
          text-shadow: 0 0 10px #00ffe7;
        }
        .futuristic-input, .futuristic-textarea {
          width: 100%;
          background: #1a2332;
          color: #00ffe7;
          border: 2px solid #00ffe7;
          border-radius: 8px;
          padding: 10px;
          margin-bottom: 16px;
          font-size: 1rem;
          font-family: 'Segoe UI', 'monospace';
          transition: border 0.2s;
        }
        .futuristic-input:focus, .futuristic-textarea:focus {
          border: 2px solid #ff00c8;
          outline: none;
        }
        .futuristic-button {
          background: linear-gradient(90deg, #00ffe7 0%, #ff00c8 100%);
          color: #1a2332;
          border: none;
          border-radius: 8px;
          padding: 12px 32px;
          font-size: 1.1rem;
          font-family: 'Orbitron', 'Segoe UI', sans-serif;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 0 10px #00ffe7;
          transition: background 0.3s, color 0.3s;
        }
        .futuristic-button:disabled {
          background: #444;
          color: #888;
          cursor: not-allowed;
        }
        .futuristic-loading {
          color: #ff00c8;
          font-family: 'Orbitron', 'Segoe UI', sans-serif;
          margin-top: 10px;
          text-align: center;
        }
        .futuristic-result {
          margin-top: 32px;
          background: rgba(0, 255, 231, 0.07);
          border-radius: 8px;
          padding: 16px;
          color: #fff;
          font-family: 'Fira Mono', 'monospace';
          box-shadow: 0 0 10px #00ffe7 inset;
        }
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap');
      `}</style>
    </div>
  );
}

export default App;
