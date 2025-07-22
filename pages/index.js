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
    <div className="neo-bg">
      <div className="neo-container">
        <h2 className="neo-title">ChatGPT × CSV参照デモ</h2>
        <input
          type="file"
          accept=".csv"
          onChange={e => setFile(e.target.files[0])}
          className="neo-input"
        /><br />
        <textarea
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          rows={5}
          cols={60}
          placeholder="指示を入力してください"
          className="neo-textarea"
        /><br />
        <button onClick={handleSend} disabled={loading} className="neo-button">
          送信
        </button>
        {loading && <div className="neo-loading">送信中...</div>}

        <div className="neo-result">
          <strong>結果:</strong>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{result}</pre>
        </div>
      </div>
      <style>{`
        .neo-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #232a34 0%, #3a4252 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .neo-container {
          background: rgba(40, 48, 60, 0.97);
          border-radius: 16px;
          box-shadow: 0 0 24px #2e3a4e44;
          padding: 36px 28px;
          max-width: 540px;
          width: 100%;
        }
        .neo-title {
          color: #b0c4de;
          font-family: 'Segoe UI', 'Orbitron', sans-serif;
          font-size: 1.7rem;
          text-align: center;
          margin-bottom: 28px;
          letter-spacing: 1px;
          text-shadow: 0 0 6px #2e3a4e44;
        }
        .neo-input, .neo-textarea {
          width: 100%;
          background: #232a34;
          color: #b0c4de;
          border: 1.5px solid #4b5a6a;
          border-radius: 7px;
          padding: 9px;
          margin-bottom: 14px;
          font-size: 1rem;
          font-family: 'Segoe UI', 'monospace';
          transition: border 0.2s;
        }
        .neo-input:focus, .neo-textarea:focus {
          border: 1.5px solid #6ca0dc;
          outline: none;
        }
        .neo-button {
          background: linear-gradient(90deg, #4b5a6a 0%, #6ca0dc 100%);
          color: #fff;
          border: none;
          border-radius: 7px;
          padding: 10px 28px;
          font-size: 1rem;
          font-family: 'Orbitron', 'Segoe UI', sans-serif;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 0 8px #6ca0dc44;
          transition: background 0.3s, color 0.3s;
        }
        .neo-button:disabled {
          background: #444;
          color: #888;
          cursor: not-allowed;
        }
        .neo-loading {
          color: #6ca0dc;
          font-family: 'Orbitron', 'Segoe UI', sans-serif;
          margin-top: 10px;
          text-align: center;
        }
        .neo-result {
          margin-top: 24px;
          background: rgba(76, 160, 220, 0.07);
          border-radius: 7px;
          padding: 12px;
          color: #e0eafc;
          font-family: 'Fira Mono', 'monospace';
          box-shadow: 0 0 6px #6ca0dc22 inset;
        }
      `}</style>
    </div>
  );

export default App;
