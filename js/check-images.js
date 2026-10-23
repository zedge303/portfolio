/**
 * Vérifie au chargement que les images de la page existent (404).
 * À inclure uniquement en développement local — retirer ou commenter en production.
 */
(function () {
  'use strict';

  var DEBUG_ENDPOINT = 'http://127.0.0.1:7457/ingest/0ddb2628-a1db-4b2d-a958-ead6d4083789';
  var DEBUG_SESSION = 'c6f2de';

  var images = document.querySelectorAll('img[src]');
  if (!images.length) return;

  images.forEach(function (img) {
    var src = img.getAttribute('src');
    if (!src || src.startsWith('data:') || src.startsWith('http')) return;

    fetch(src, { method: 'HEAD' })
      .then(function (res) {
        if (res.ok) return;
        // #region agent log
        fetch(DEBUG_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': DEBUG_SESSION },
          body: JSON.stringify({
            sessionId: DEBUG_SESSION,
            location: 'js/check-images.js',
            message: 'Broken image src',
            data: { src: src, status: res.status, page: location.pathname },
            timestamp: Date.now(),
            hypothesisId: 'H3',
            runId: 'pre-fix',
          }),
        }).catch(function () {});
        // #endregion
        img.classList.add('img-missing');
        img.alt = (img.alt || 'Image') + ' (fichier introuvable)';
      })
      .catch(function () {});
  });
})();
