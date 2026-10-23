/**
 * Lightbox galerie — zoom au clic / glisser pour déplacer l’image zoomée.
 * Utilisé sur les pages serie-*.html (éléments #lightbox requis).
 */
(function () {
  'use strict';

  var DEBUG_ENDPOINT = 'http://127.0.0.1:7457/ingest/0ddb2628-a1db-4b2d-a958-ead6d4083789';
  var DEBUG_SESSION = 'c6f2de';

  function debugLog(location, message, data, hypothesisId) {
    // #region agent log
    fetch(DEBUG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': DEBUG_SESSION },
      body: JSON.stringify({
        sessionId: DEBUG_SESSION,
        location: location,
        message: message,
        data: data || {},
        timestamp: Date.now(),
        hypothesisId: hypothesisId,
        runId: 'pre-fix',
      }),
    }).catch(function () {});
    // #endregion
  }

  var CONFIG = {
    zoomLevel: 2.5,
    dragThreshold: 5,
    imageSelector: '.puzzle-column img, .project-image img',
  };

  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('img-grand');
  var closeBtn = document.querySelector('#lightbox .close');

  if (!lightbox || !lightboxImg || !closeBtn) {
    debugLog('js/lightbox.js:init', 'Lightbox markup missing — script skipped', {
      hasLightbox: !!lightbox,
      hasImg: !!lightboxImg,
      hasClose: !!closeBtn,
      page: document.title,
    }, 'H4');
    return;
  }

  var galleryImages = document.querySelectorAll(CONFIG.imageSelector);

  var drag = {
    active: false,
    startX: 0,
    startY: 0,
    translateX: 0,
    translateY: 0,
    lastTranslateX: 0,
    lastTranslateY: 0,
  };

  debugLog('js/lightbox.js:init', 'Lightbox ready', {
    imageCount: galleryImages.length,
    page: document.title,
  }, 'H1');

  function applyTransform() {
    var scale = lightboxImg.classList.contains('zoomed') ? CONFIG.zoomLevel : 1;
    lightboxImg.style.transform =
      'translate(' + drag.translateX + 'px, ' + drag.translateY + 'px) scale(' + scale + ')';
  }

  function resetZoom() {
    lightboxImg.classList.remove('zoomed');
    lightbox.classList.remove('zoomed-mode');
    drag.translateX = 0;
    drag.translateY = 0;
    drag.lastTranslateX = 0;
    drag.lastTranslateY = 0;
    lightboxImg.style.transform = 'translate(0px, 0px) scale(1)';
  }

  function openLightbox(src) {
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    lightboxImg.src = src;
    resetZoom();
    debugLog('js/lightbox.js:open', 'Lightbox opened', { src: src }, 'H2');
  }

  function closeLightbox(reason) {
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
    resetZoom();
    debugLog('js/lightbox.js:close', 'Lightbox closed', { reason: reason || 'unknown' }, 'H2');
  }

  galleryImages.forEach(function (img) {
    img.addEventListener('click', function () {
      openLightbox(this.src);
    });
  });

  closeBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    closeLightbox('close-button');
  });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox('backdrop');
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox.style.display === 'flex') {
      closeLightbox('escape');
    }
  });

  function onPointerDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag.active = true;
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    lightboxImg.classList.add('dragging');
    if (lightboxImg.setPointerCapture) {
      lightboxImg.setPointerCapture(e.pointerId);
    }
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!drag.active || !lightboxImg.classList.contains('zoomed')) return;
    drag.translateX = drag.lastTranslateX + (e.clientX - drag.startX);
    drag.translateY = drag.lastTranslateY + (e.clientY - drag.startY);
    applyTransform();
  }

  function onPointerUp(e) {
    if (!drag.active) return;

    var deltaX = e.clientX - drag.startX;
    var deltaY = e.clientY - drag.startY;
    var isTap =
      Math.abs(deltaX) <= CONFIG.dragThreshold &&
      Math.abs(deltaY) <= CONFIG.dragThreshold;

    if (isTap) {
      if (lightboxImg.classList.contains('zoomed')) {
        resetZoom();
        debugLog('js/lightbox.js:zoom', 'Zoom reset (tap)', { pointerType: e.pointerType }, 'H1');
      } else {
        lightboxImg.classList.add('zoomed');
        lightbox.classList.add('zoomed-mode');
        var rect = lightboxImg.getBoundingClientRect();
        var centerX = rect.left + rect.width / 2;
        var centerY = rect.top + rect.height / 2;
        drag.translateX = -(e.clientX - centerX) * CONFIG.zoomLevel;
        drag.translateY = -(e.clientY - centerY) * CONFIG.zoomLevel;
        drag.lastTranslateX = drag.translateX;
        drag.lastTranslateY = drag.translateY;
        applyTransform();
        debugLog('js/lightbox.js:zoom', 'Zoom in (tap)', { pointerType: e.pointerType }, 'H1');
      }
    } else {
      drag.lastTranslateX = drag.translateX;
      drag.lastTranslateY = drag.translateY;
    }

    drag.active = false;
    lightboxImg.classList.remove('dragging');
    if (lightboxImg.releasePointerCapture) {
      try {
        lightboxImg.releasePointerCapture(e.pointerId);
      } catch (err) {
        /* ignore */
      }
    }
  }

  lightboxImg.addEventListener('pointerdown', onPointerDown);
  lightboxImg.addEventListener('pointermove', onPointerMove);
  lightboxImg.addEventListener('pointerup', onPointerUp);
  lightboxImg.addEventListener('pointercancel', onPointerUp);
})();
