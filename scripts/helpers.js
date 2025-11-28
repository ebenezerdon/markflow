window.App = window.App || {};

(function() {
  // Debounce function to limit render frequency
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  // Local Storage Wrapper
  const Storage = {
    get(key, fallback = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
      } catch (e) {
        console.error('Error reading from localStorage', e);
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error('Error writing to localStorage', e);
      }
    }
  };

  // Markdown Parser Setup (using marked)
  function configureMarked() {
    if (typeof marked !== 'undefined') {
      marked.use({
        breaks: true,
        gfm: true,
        headerIds: true,
        mangle: false
      });
    }
  }

  // Sanitize HTML
  function sanitize(html) {
    if (typeof DOMPurify !== 'undefined') {
      return DOMPurify.sanitize(html);
    }
    return html;
  }

  // Download content as file
  function downloadFile(filename, content, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  window.App.Helpers = {
    debounce,
    Storage,
    configureMarked,
    sanitize,
    downloadFile
  };
})();