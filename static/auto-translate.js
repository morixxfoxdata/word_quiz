// 英単語入力フィールドの自動翻訳機能
document.addEventListener('DOMContentLoaded', function() {
  let translationTimeout;
  const entryInput = document.querySelector('input[name="entry"]');
  const meaningInput = document.querySelector('input[name="meaning"]');
  
  if (entryInput && meaningInput) {
    // Enterキー押下時に翻訳実行
    entryInput.addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
        event.preventDefault(); // フォーム送信を防ぐ
        clearTimeout(translationTimeout);
        const word = this.value.trim();
        if (word.length > 0) {
          translateWord(word);
        }
      }
    });
    
    // 入力中のデバウンス（1秒に延長）
    entryInput.addEventListener('input', function() {
      clearTimeout(translationTimeout);
      const word = this.value.trim();
      
      if (word.length > 0) {
        // 入力停止から1秒後に翻訳を実行
        translationTimeout = setTimeout(() => {
          // 意味フィールドが空の場合のみ翻訳実行
          if (meaningInput.value.trim() === '') {
            translateWord(word);
          }
        }, 1000);
      } else {
        meaningInput.value = '';
      }
    });
    
    // フォーカスアウト時に翻訳実行（最優先）
    entryInput.addEventListener('blur', function() {
      clearTimeout(translationTimeout);
      const word = this.value.trim();
      if (word.length > 0 && meaningInput.value.trim() === '') {
        translateWord(word);
      }
    });
  }
  
  async function translateWord(word) {
    try {
      // ローディング状態を表示
      meaningInput.value = '翻訳中...';
      meaningInput.disabled = true;
      
      const response = await fetch('/translate_api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word: word })
      });
      
      if (response.ok) {
        const data = await response.json();
        meaningInput.value = data.meaning;
      } else {
        meaningInput.value = `Gemini翻訳エラー：${word}`;
      }
    } catch (error) {
      console.error('Gemini translation error:', error);
      meaningInput.value = `翻訳未対応：${word}`;
    } finally {
      meaningInput.disabled = false;
    }
  }
}); 