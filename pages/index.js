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
      </div>
<style>{`
  .whiteblue-bg {
    min-height: 100vh;
    background: linear-gradient(135deg, #e3f6fd 0%, #ffffff 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .whiteblue-container {
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 3px 24px #bde7f7bb, 0 0 0px #e3f6fd inset;
    padding: 42px 32px 28px 32px;
    max-width: 540px;
    width: 100%;
    border: 1.5px solid #e3f6fd;
    position: relative;
  }
  .whiteblue-title {
    color: #d32f2f; /* 赤 */
    font-family: 'Segoe UI', 'Meiryo', sans-serif;
    font-size: 2rem;
    text-align: center;
    margin-bottom: 30px;
    letter-spacing: 2px;
    font-weight: bold;
  }
  .whiteblue-input, .whiteblue-textarea {
    width: 100%;
    background: #f0fbff;
    color: #222;
    border: 1.5px solid #bde7f7;
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 16px;
    font-size: 1rem;
    font-family: 'Segoe UI', 'monospace';
    transition: border 0.2s;
    box-shadow: 0 1px 6px #e3f6fd55;
  }
  .whiteblue-input:focus, .whiteblue-textarea:focus {
    border: 1.5px solid #80bfe8;
    outline: none;
  }
  .whiteblue-button {
    background: linear-gradient(90deg, #a2e1fa 0%, #e0e3ea 100%);
    color: #287fb8;
    border: none;
    border-radius: 10px;
    padding: 12px 28px;
    font-size: 1.09rem;
    font-family: 'Segoe UI', 'Meiryo', sans-serif;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 2px 8px #bde7f7;
    transition: background 0.3s, color 0.3s;
    margin-bottom: 15px;
  }
  .whiteblue-button:disabled {
    background: #eee;
    color: #ccc;
    cursor: not-allowed;
    box-shadow: none;
  }
  .whiteblue-loading {
    color: #287fb8;
    margin-top: 10px;
    text-align: center;
    font-size: 1rem;
  }
  .whiteblue-result {
    margin-top: 20px;
    background: #f0fbff;
    border-radius: 10px;
    padding: 13px;
    color: #287fb8;
    font-family: 'Fira Mono', 'monospace';
    border: 1.2px solid #bde7f7;
    min-height: 130px;
    max-height: 300px;
    overflow-y: auto;
    font-size: 1rem;
    line-height: 1.5;
    word-break: break-all;
    box-sizing: border-box;
  }
  .whiteblue-result pre {
    background: none;
    padding: 0;
    margin: 0;
    white-space: pre-wrap;
    color: inherit;
  }
`}</style>
    </div>
  );
}

export default App;
