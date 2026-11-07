/* The owner's light or dark choice, before first paint. Only this one key is ever stored, and it holds no data. No choice: light. System is a choice, and follows the system live. */
(function () {
  var KEY = 'reclaim-theme';
  var COLOR = { light: '#EEEFEA', dark: '#161917' };
  var dark = matchMedia('(prefers-color-scheme: dark)');
  function read() {
    try {
      var v = localStorage.getItem(KEY);
      return v === 'dark' || v === 'system' ? v : 'light';
    } catch (e) {
      return 'light';
    }
  }
  function apply() {
    var choice = read();
    var theme = choice === 'system' ? (dark.matches ? 'dark' : 'light') : choice;
    document.documentElement.dataset.theme = theme;
    // The status bar follows the theme shown, not the system. A chosen theme drops each tag's media query, since some
    // Android builds keep the colour of the tag whose query matches the system and do not see its content change.
    var metas = document.querySelectorAll('meta[name=theme-color]');
    for (var i = 0; i < metas.length; i++) {
      var m = metas[i];
      if (!m.dataset.scheme) m.dataset.scheme = (m.getAttribute('media') || '').indexOf('dark') >= 0 ? 'dark' : 'light';
      if (choice === 'system') {
        m.setAttribute('media', '(prefers-color-scheme: ' + m.dataset.scheme + ')');
        m.content = COLOR[m.dataset.scheme];
      } else {
        m.removeAttribute('media');
        m.content = COLOR[theme];
      }
    }
  }
  dark.addEventListener('change', apply);
  window.reclaimTheme = {
    get: read,
    set: function (choice) {
      try {
        localStorage.setItem(KEY, choice);
      } catch (e) {}
      apply();
    },
  };
  apply();
})();
