(function () {
  'use strict';

  // Année dans le footer
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Photo : utiliser le src déjà dans le HTML, sinon essayer plusieurs noms
  var photo = document.getElementById('heroPhoto');
  var wrap = photo ? photo.closest('.hero-photo-wrap') : null;
  var fallback = document.getElementById('photoFallback');
  var htmlSrc = photo && photo.getAttribute('src');
  var defaultPaths = [
    'photo.png',
    'assets/photo.png',
    'photo.jpg',
    'assets/photo.jpg'
  ];
  var paths = htmlSrc ? [htmlSrc] : defaultPaths;

  function showPhoto() {
    if (wrap) wrap.classList.add('has-photo');
    if (fallback) fallback.style.display = 'none';
  }
  function tryPhoto(index) {
    if (!photo || index >= paths.length) {
      if (wrap) wrap.classList.remove('has-photo');
      if (fallback) fallback.style.display = 'flex';
      return;
    }
    photo.onerror = function () { tryPhoto(index + 1); };
    photo.onload = showPhoto;
    if (paths[index]) photo.src = paths[index];
  }
  if (photo) {
    if (photo.complete && photo.naturalWidth > 0) showPhoto();
    else tryPhoto(0);
  }

  // Animations au scroll
  var animated = document.querySelectorAll('[data-animate]');
  if (animated.length && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.1 });
    animated.forEach(function (el) { observer.observe(el); });
  } else {
    animated.forEach(function (el) { el.classList.add('visible'); });
  }

  // Menu mobile
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('is-open');
    });
  }

  // GitHub : charger les repos Python
  var input = document.getElementById('githubUsername');
  var btn = document.getElementById('fetchRepos');
  var list = document.getElementById('reposList');
  var placeholder = document.getElementById('reposPlaceholder');

  function setPlaceholder(visible) {
    if (placeholder) placeholder.style.display = visible ? 'block' : 'none';
  }

  function setLoading(loading) {
    if (loading) {
      setPlaceholder(false);
      list.innerHTML = '<p class="repos-placeholder repos-loading">Chargement des dépôts…</p>';
      return;
    }
  }

  function showError(msg) {
    list.innerHTML = '<p class="repos-error">' + escapeHtml(msg) + '</p>';
  }

  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function renderRepos(repos) {
    if (!repos || repos.length === 0) {
      list.innerHTML = '<p class="repos-placeholder">Aucun dépôt Python public trouvé.</p>';
      return;
    }
    setPlaceholder(false);
    list.innerHTML = repos.map(function (r) {
      var desc = r.description ? escapeHtml(r.description) : 'Sans description';
      var lang = r.language || '';
      var stars = r.stargazers_count ? r.stargazers_count + ' ★' : '';
      var meta = [lang, stars].filter(Boolean).join(' · ');
      return (
        '<a href="' + escapeHtml(r.html_url) + '" class="repo-card" target="_blank" rel="noopener">' +
          '<h3>' + escapeHtml(r.name) + '</h3>' +
          '<p>' + desc + '</p>' +
          (meta ? '<div class="repo-meta">' + escapeHtml(meta) + '</div>' : '') +
        '</a>'
      );
    }).join('');
  }

  if (btn && list) {
    btn.addEventListener('click', function () {
      var username = (input && input.value) ? input.value.trim() : '';
      if (!username) {
        showError('Indique ton pseudo GitHub.');
        return;
      }

      setLoading(true);
      fetch('https://api.github.com/users/' + encodeURIComponent(username) + '/repos?per_page=100&sort=updated')
        .then(function (res) {
          if (!res.ok) throw new Error('Compte ou pseudo introuvable.');
          return res.json();
        })
        .then(function (data) {
          var pythonRepos = data.filter(function (r) {
            return (r.language || '').toLowerCase() === 'python';
          });
          renderRepos(pythonRepos);
        })
        .catch(function (err) {
          showError(err.message || 'Impossible de charger les dépôts.');
        });
    });
  }
})();
