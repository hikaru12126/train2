import React, { useState, useEffect } from 'react';
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

      // 結果テキスト部分
      setResult(data.result || data.error);

      // Vega部分を抽出してJSONパース
      if (data.result) {
        const m = data.result.match(/---BEGIN VEGA---([\s\S]+?)---END VEGA---/);
        if (m && m[1]) {
          let vegaRaw = m[1].trim();
          // もし```jsonやバッククォートで囲まれていたら除去（安全対策）
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
    <div className="neo-bg">
      <div className="neo-container">
        <h2 className="neo-title">JRCM 走行解析アプリ</h2>
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
          className="futuristic-textarea"
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
        <button onClick={handleSend} disabled={loading} className="neo-button">
          送信
        </button>
        {loading && <div className="neo-loading">送信中...</div>}

        <div className="neo-result">
          <strong>結果:</strong>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{result ? result.replace(/---BEGIN VEGA---[\s\S]+---END VEGA---/, '') : ''}</pre>
        </div>

        {/* Vegaグラフを出力 */}
        {vegaSpec && (
          <div style={{ marginTop: 24 }}>
            <VegaLite spec={vegaSpec} />
          </div>
        )}

        {/* デバッグ用にAI生応答も表示（開閉可能） */}
        <details>
          <summary>AI応答raw表示（開くと詳細）</summary>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f8f9fa', fontSize: '12px' }}>{result}</pre>
        </details>
      </div>
      {/* ... スタイル省略 ... */}
    </div>
  );
}

export default App;
