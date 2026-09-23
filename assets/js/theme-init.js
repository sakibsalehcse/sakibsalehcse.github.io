try { const saved = localStorage.getItem('sakib-theme'); document.documentElement.dataset.theme = saved === 'graphite' || saved === 'light' ? 'graphite' : 'dark'; } catch (_) {}
