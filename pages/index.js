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
  .futuristic-bg {
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f6fa 0%, #e0e3ea 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .futuristic-container {
    background: #f8f9fb;
    border-radius: 28px;
    box-shadow: 0 8px 40px #b0b3b8, 0 0 0px #e0e3ea inset;
    padding: 56px 40px 36px 40px;
    max-width: 540px;   /* 元のサイズを維持 */
    width: 100%;        /* レスポンシブ */
    border: 2px solid #e0e3ea;
    position: relative;
  }
  .futuristic-title {
    color: #d32f2f;
    font-family: 'Orbitron', 'Segoe UI', sans-serif;
    font-size: 2.3rem;
    text-align: center;
    margin-bottom: 38px;
    letter-spacing: 3px;
    text-shadow: 0 0 16px #ffb3b3, 0 0 2px #fff;
    border-radius: 12px;
    padding: 12px 0;
  }
  .futuristic-input, .futuristic-textarea {
    width: 100%;
    background: #f5f6fa;
    color: #d32f2f;
    border: 2px solid #b0b3b8;
    border-radius: 12px;
    padding: 14px;
    margin-bottom: 20px;
    font-size: 1.08rem;
    font-family: 'Segoe UI', 'monospace';
    transition: border 0.2s, box-shadow 0.2s;
    box-shadow: 0 2px 12px #e0e3ea33;
  }
  .futuristic-input:focus, .futuristic-textarea:focus {
    border: 2px solid #d32f2f;
    outline: none;
    box-shadow: 0 0 12px #ffb3b3;
  }
  .futuristic-button {
    background: linear-gradient(90deg, #ffb3b3 0%, #d32f2f 100%);
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 16px 40px;
    font-size: 1.18rem;
    font-family: 'Orbitron', 'Segoe UI', sans-serif;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 16px #ffb3b3;
    transition: background 0.3s, color 0.3s, box-shadow 0.2s;
    margin-bottom: 20px;
  }
  .futuristic-button:disabled {
    background: #eee;
    color: #bbb;
    cursor: not-allowed;
    box-shadow: none;
  }
  .futuristic-loading {
    color: #d32f2f;
    font-family: 'Orbitron', 'Segoe UI', sans-serif;
    margin-top: 14px;
    text-align: center;
    font-size: 1.12rem;
    letter-spacing: 1px;
  }
  .futuristic-result {
    margin-top: 38px;
    background: linear-gradient(90deg, #f5f6fa 60%, #e0e3ea 100%);
    border-radius: 12px;
    padding: 20px;
    color: #d32f2f;
    font-family: 'Fira Mono', 'monospace';
    box-shadow: 0 0 16px #b0b3b833 inset;
    border: 2px solid #b0b3b8;
    width: 100%;              /* コンテナ内で最大 */
    min-height: 230px;        /* ここで高さ調整（お好みで） */
    max-height: 400px;        /* より多く表示 */
    overflow-y: auto;         /* スクロール */
    font-size: 1.05rem;
    line-height: 1.6;
    word-break: break-all;
    box-sizing: border-box;
  }
  .futuristic-result pre {
    background: none;
    font-size: inherit;
    color: inherit;
    padding: 0;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
  }
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap');
`}</style>
    </div>
  );
}

export default App;
