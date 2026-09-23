(() => {
  'use strict';

  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    return;
  }

  const BUTTON_ID = 'read-aloud-button';
  let reading = false;
  let voices = [];
  let endCheckTimer = null;

  const loadVoices = () => {
    voices = window.speechSynthesis.getVoices();
  };
  loadVoices();
  if ('onvoiceschanged' in window.speechSynthesis) {
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
  }

  const currentLang = () => {
    try {
      if (typeof activeSiteLanguage === 'string' && activeSiteLanguage) {
        return activeSiteLanguage;
      }
    } catch (e) {
      /* fall through */
    }
    return (document.documentElement.lang || 'en').slice(0, 2);
  };

  const t = key => {
    try {
      if (typeof siteTranslate === 'function') {
        return siteTranslate(key);
      }
    } catch (e) {
      /* fall through */
    }
    return '';
  };

  const pickVoice = lang => {
    const matches = voices.filter(v => (v.lang || '').toLowerCase().startsWith(lang));
    if (!matches.length) {
      return null;
    }
    const preferred = matches.find(v => /google|microsoft|samantha|monica|jorge|paulina|diego|lucia/i.test(v.name));
    return preferred || matches[0];
  };

  const collectText = () => {
    const main = document.querySelector('main');
    if (!main) {
      return '';
    }
    const parts = [];
    main.querySelectorAll('h1, h2, h3, p').forEach(el => {
      if (el.closest('[aria-hidden="true"]')) {
        return;
      }
      const text = (el.innerText || '').replace(/\s+/g, ' ').trim();
      if (text) {
        parts.push(text);
      }
    });
    const deduped = parts.filter((text, index) => text !== parts[index - 1]);
    return deduped.join('. ');
  };

  const chunkText = text => {
    const chunks = [];
    const sentences = text.match(/[^.!?;]+[.!?;]+["']?|\S[^.!?;]*$/g) || [text];
    let current = '';
    sentences.forEach(sentence => {
      sentence = sentence.trim();
      if (!sentence) {
        return;
      }
      if (current && (current + ' ' + sentence).length > 220) {
        chunks.push(current.trim());
        current = sentence;
      } else {
        current = (current + ' ' + sentence).trim();
      }
    });
    if (current.trim()) {
      chunks.push(current.trim());
    }
    return chunks;
  };

  let button = null;

  const updateButton = () => {
    if (!button) {
      return;
    }
    button.classList.toggle('is-reading', reading);
    button.setAttribute('aria-pressed', reading ? 'true' : 'false');
    const label = reading
      ? (t('home.readAloud.stop') || 'Stop reading')
      : (t('home.readAloud.start') || 'Read this page aloud');
    button.setAttribute('aria-label', label);
    button.title = label;
  };

  const stop = () => {
    if (endCheckTimer) {
      clearInterval(endCheckTimer);
      endCheckTimer = null;
    }
    window.speechSynthesis.cancel();
    if (reading) {
      reading = false;
      updateButton();
    }
  };

  const start = () => {
    const lang = currentLang();
    const text = collectText();
    if (!text) {
      return;
    }
    window.speechSynthesis.cancel();
    const voice = pickVoice(lang);
    chunkText(text).forEach(part => {
      const utterance = new SpeechSynthesisUtterance(part);
      utterance.lang = lang === 'es' ? 'es-MX' : 'en-US';
      utterance.rate = 1;
      if (voice) {
        utterance.voice = voice;
      }
      window.speechSynthesis.speak(utterance);
    });
    reading = true;
    updateButton();
    if (endCheckTimer) {
      clearInterval(endCheckTimer);
    }
    endCheckTimer = setInterval(() => {
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        clearInterval(endCheckTimer);
        endCheckTimer = null;
        reading = false;
        updateButton();
      }
    }, 500);
  };

  const init = () => {
    if (document.getElementById(BUTTON_ID)) {
      return;
    }
    button = document.createElement('button');
    button.type = 'button';
    button.id = BUTTON_ID;
    button.className = 'read-aloud';
    button.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<g class="read-aloud__speaker">' +
      '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"></polygon>' +
      '<path class="read-aloud__waves" d="M15.5 8.5a5 5 0 0 1 0 7"></path>' +
      '<path class="read-aloud__waves" d="M18.5 5.5a9.5 9.5 0 0 1 0 13"></path>' +
      '</g>' +
      '<rect class="read-aloud__stop" x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none"></rect>' +
      '</svg>';
    button.addEventListener('click', () => {
      if (reading) {
        stop();
      } else {
        start();
      }
    });
    document.body.appendChild(button);
    updateButton();

    new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'lang' && reading) {
          stop();
        }
      });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    window.addEventListener('pagehide', stop);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stop();
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
