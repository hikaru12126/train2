import React, { useState } from 'react';
import { VegaLite } from 'react-vega';

function App() {
  const [instruction, setInstruction] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [vegaSpec, setVegaSpec] = useState(null);

  const handleSend = async () => {
    if (!file) {
      setResult('CSVファイルを選択してください');
      setVegaSpec(null);
      return;
    }
    setLoading(true);
    setResult('');
    setVegaSpec(null);
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

      if (data.result) {
        const m = data.result.match(/---BEGIN VEGA---([\s\S]+?)---END VEGA---/);
        if (m && m[1]) {
          let vegaRaw = m[1].trim();
          vegaRaw = vegaRaw.replace(/^```json\s*/, '').replace(/```$/, '').trim();
          try {
            setVegaSpec(JSON.parse(vegaRaw));
          } catch (e) {
            setVegaSpec(null);
          }
        }
      }
    } catch (e) {
      setResult('エラーが発生しました');
      setVegaSpec(null);
    }
    setLoading(false);
  };

  return (
    <div className="red-bg">
      <div className="red-container">
        <h2 className="red-title">JRCM 走行解析アプリ</h2>
        <input
          type="file"
          accept=".csv"
          onChange={e => setFile(e.target.files[0])}
          className="red-input"
        /><br />
        <textarea
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          rows={5}
          cols={60}
          placeholder="指示を入力してください"
          className="red-textarea"
          onKeyDown={e => {
            if (
              e.key === 'Enter' &&
              !e.shiftKey &&
              !e.ctrlKey &&
              !e.altKey
            ) {
              e.preventDefault();
              handleSend();
            }
          }}
        ></textarea>
        <br />
        <button onClick={handleSend} disabled={loading} className="red-button">
          送信
        </button>
        {loading && <div className="red-loading">送信中...</div>}

        <div className="red-result">
          <strong>結果:</strong>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{result ? result.replace(/---BEGIN VEGA---[\s\S]+---END VEGA---/, '') : ''}</pre>
        </div>

        {vegaSpec && (
          <div style={{ marginTop: 24 }}>
            <VegaLite spec={vegaSpec} />
          </div>
        )}

        <details>
          <summary>AI応答raw表示（開くと詳細）</summary>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#fff0f0', fontSize: '12px' }}>{result}</pre>
        </details>
      </div>
      <style>{`
        .red-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #fff5f5 0%, #ffeaea 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .red-container {
          background: rgba(255,255,255,0.97);
          border-radius: 20px;
          box-shadow: 0 0 32px #ffb3b3, 0 0 8px #ffeaea inset;
          padding: 40px 32px;
          max-width: 600px;
          width: 100%;
        }
        .red-title {
          color: #d32f2f;
          font-family: 'Orbitron', 'Segoe UI', sans-serif;
          font-size: 2rem;
          text-align: center;
          margin-bottom: 32px;
          letter-spacing: 2px;
          text-shadow: 0 0 8px #ffb3b3;
        }
        .red-input, .red-textarea {
          width: 100%;
          background: #fff5f5;
          color: #d32f2f;
          border: 2px solid #ffb3b3;
          border-radius: 8px;
          padding: 10px;
          margin-bottom: 16px;
          font-size: 1rem;
          font-family: 'Segoe UI', 'monospace';
          transition: border 0.2s;
        }
        .red-input:focus, .red-textarea:focus {
          border: 2px solid #d32f2f;
          outline: none;
        }
        .red-button {
          background: linear-gradient(90deg, #ffb3b3 0%, #d32f2f 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px 32px;
          font-size: 1.1rem;
          font-family: 'Orbitron', 'Segoe UI', sans-serif;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 0 8px #ffb3b3;
          transition: background 0.3s, color 0.3s;
        }
        .red-button:disabled {
          background: #eee;
          color: #bbb;
          cursor: not-allowed;
        }
        .red-loading {
          color: #d32f2f;
          font-family: 'Orbitron', 'Segoe UI', sans-serif;
          margin-top: 10px;
          text-align: center;
        }
        .red-result {
          margin-top: 32px;
          background: rgba(255, 179, 179, 0.12);
          border-radius: 8px;
          padding: 16px;
          color: #222;
          font-family: 'Fira Mono', 'monospace';
          box-shadow: 0 0 8px #ffb3b3 inset;
        }
        details {
          margin-top: 24px;
        }
        summary {
          cursor: pointer;
          color: #d32f2f;
          font-weight: bold;
        }
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap');
      `}</style>
    </div>
  );
}

export default App;
