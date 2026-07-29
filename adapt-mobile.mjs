#!/usr/bin/env node
/**
 * Mineradio Mobile Adapter
 * Injects mobile CSS/JS into the original index.html
 */
import fs from 'fs';
import path from 'path';

// Clone is at /tmp/mineradio (Git Bash: C:/Users/mo'r'n/AppData/Local/Temp/mineradio)
const srcPath = 'C:/Users/mo\'r\'n/AppData/Local/Temp/mineradio/public/index.html';
const destPath = 'D:/CCS/Test/.claude/.claude/mineradio-mobile/public/index.html';

let html = fs.readFileSync(srcPath, 'utf8');

// ============================================================
// 1. Inject mobile CSS before </style>
// ============================================================
const mobileCSS = `
/* ===== MINERADIO MOBILE ADAPTATION ===== */
:root {
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-left: env(safe-area-inset-left, 0px);
  --safe-area-right: env(safe-area-inset-right, 0px);
  --touch-target-min: 44px;
}

/* Prevent text selection and callout on mobile */
* {
  -webkit-touch-callout: none !important;
}

/* Hide desktop-only elements on mobile — DO NOT hide #desktop-window-shell (it wraps all main content as display:contents) */
body:not(.desktop-shell) #desktop-titlebar,
body:not(.desktop-shell) #fullscreen-diy-zone,
#desktop-lyrics-launcher,
.desktop-only { display: none !important; }

/* Mobile body — lock viewport, prevent rubber-band scroll */
body {
  padding-top: var(--safe-area-top);
  padding-bottom: var(--safe-area-bottom);
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
  overscroll-behavior: none;
  position: fixed;
  inset: 0;
  overflow: hidden;
}

/* Mobile viewport — use dvh */
html, body {
  height: 100dvh;
  height: -webkit-fill-available;
  width: 100vw;
  max-width: 100vw;
}

/* Touch-friendly sizing — enlarge all tappable elements */
button, .clickable, [role="button"], input, select, textarea {
  min-height: var(--touch-target-min);
  min-width: var(--touch-target-min);
}

/* ---- Search area — fix for mobile viewport ---- */
body:not(.desktop-shell) #search-area {
  position: fixed;
  top: calc(var(--safe-area-top) + 8px) !important;
  left: 50% !important;
  transform: translateX(-50%);
  right: auto !important;
  width: calc(100vw - 24px) !important;
  max-width: 480px;
  z-index: 400;
}
body:not(.desktop-shell) #search-area.peek {
  top: calc(var(--safe-area-top) + 8px) !important;
}

/* Search box sizing */
body:not(.desktop-shell) #search-box {
  height: 44px;
  border-radius: 22px;
}
body:not(.desktop-shell) #search-box input {
  font-size: 16px !important; /* prevent iOS zoom on focus */
}

/* Search results — full width, scrollable */
body:not(.desktop-shell) #search-results {
  max-height: calc(100dvh - 160px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Search mode tabs — compact for mobile */
body:not(.desktop-shell) .search-mode-tabs button {
  padding: 6px 12px;
  font-size: 12px;
}

/* ---- Top-right controls ---- */
body:not(.desktop-shell) #top-right {
  position: fixed;
  top: calc(var(--safe-area-top) + 10px) !important;
  right: calc((100vw - min(100vw - 32px, 480px)) / 2 + 8px) !important;
  z-index: 401;
}

/* ---- Home / empty home — override desktop media queries for mobile ---- */
body:not(.desktop-shell) #empty-home {
  position: fixed !important;
  top: calc(var(--safe-area-top) + 68px) !important;
  bottom: calc(52px + var(--safe-area-bottom)) !important;
  width: calc(100vw - 20px) !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Cards and tiles — compact for mobile */
body:not(.desktop-shell) .home-hero {
  min-height: 180px !important;
  padding: 14px !important;
}
body:not(.desktop-shell) .home-grid {
  grid-template-columns: 1fr 1fr !important;
  gap: 8px !important;
}
body:not(.desktop-shell) .home-card {
  min-height: 90px !important;
  padding: 10px 12px !important;
}
body:not(.desktop-shell) .home-card-title {
  font-size: 14px !important;
}
body:not(.desktop-shell) .home-card-sub {
  font-size: 10px !important;
}
body:not(.desktop-shell) .home-card-art {
  width: 56px !important;
  height: 56px !important;
  right: 8px !important;
  bottom: 8px !important;
}
body:not(.desktop-shell) .home-tile-row {
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 8px !important;
}
body:not(.desktop-shell) .home-tile {
  min-height: 100px !important;
  padding: 8px !important;
}
body:not(.desktop-shell) .home-tile-cover {
  height: 50px !important;
}
body:not(.desktop-shell) .home-rail {
  gap: 8px !important;
}

/* ---- Playlist panel — full-width bottom sheet on mobile ---- */
body:not(.desktop-shell) #playlist-panel {
  position: fixed;
  z-index: 500;
  top: auto !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  width: 100vw !important;
  max-width: 100vw !important;
  max-height: 65dvh !important;
  border-radius: 20px 20px 0 0 !important;
  transform: translateY(100%) !important;
  transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease !important;
  opacity: 1 !important;
  pointer-events: auto !important;
  padding-bottom: calc(var(--safe-area-bottom) + 12px) !important;
  overflow-y: auto;
}
body:not(.desktop-shell) #playlist-panel.show,
body:not(.desktop-shell) #playlist-panel.peek {
  left: 0 !important;
  transform: translateY(0) !important;
}

/* ---- Lyrics panel ---- */
body:not(.desktop-shell) .lyrics-panel {
  position: fixed;
  z-index: 500;
  top: auto !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  width: 100vw !important;
  max-height: 70dvh !important;
  border-radius: 20px 20px 0 0 !important;
  padding-bottom: calc(var(--safe-area-bottom) + 12px) !important;
}

/* ---- Settings / Fx panel — fullscreen on mobile ---- */
body:not(.desktop-shell) #fx-panel {
  position: fixed !important;
  z-index: 600 !important;
  inset: 0 !important;
  width: 100vw !important;
  max-width: 100vw !important;
  height: 100dvh !important;
  max-height: 100dvh !important;
  border-radius: 0 !important;
  padding: calc(var(--safe-area-top) + 12px) 12px calc(var(--safe-area-bottom) + 12px) 12px !important;
  overflow-y: auto;
}

/* ---- Toast notifications ---- */
body:not(.desktop-shell) #toast {
  top: calc(var(--safe-area-top) + 56px) !important;
}

/* ---- Player controls —— above bottom nav ---- */
body.has-mobile-nav #player-controls-strip {
  bottom: calc(68px + var(--safe-area-bottom));
}

/* ---- Reduce particle density for mobile GPU ---- */
@media (max-width: 480px) {
  :root { --particle-multiplier: 0.5; }
}
@media (min-width: 481px) and (max-width: 768px) {
  :root { --particle-multiplier: 0.7; }
}

/* ---- Mobile scroll areas — smooth scrolling ---- */
.playlist-panel, .lyrics-panel, .search-results, .podcast-list {
  -webkit-overflow-scrolling: touch;
}

/* ---- Larger touch targets for lists ---- */
.playlist-item, .queue-item, .search-result-item {
  min-height: 56px;
  padding: 12px 16px;
}

/* ---- Prevent zoom on input focus ---- */
input[type="text"], input[type="search"], input[type="email"], input[type="tel"], input[type="password"] {
  font-size: 16px !important;
}

/* ---- Hide elements that don't work on mobile ---- */
#upload-tip, #visual-guide-btn, #update-entry, #diy-mode-btn,
.desktop-window-btn, .desktop-app-mark, .desktop-app-title,
#fullscreen-diy-btn, #fx-fab, #desktop-lyrics-launcher {
  display: none !important;
}

/* ---- Adjust glass panels for mobile ---- */
.glass-saved-panel {
  max-width: calc(100vw - 24px);
  max-height: calc(100dvh - 120px);
}

/* ---- Album background fix ---- */
#album-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

	/* ---- Portrait mode adjustments ---- */
	body.portrait #search-area {
	  width: calc(100vw - 20px) !important;
	}
	body.portrait #empty-home {
	  top: calc(var(--safe-area-top) + 62px) !important;
	  bottom: calc(44px + var(--safe-area-bottom)) !important;
	  width: calc(100vw - 16px) !important;
	  left: 50% !important;
	  transform: translateX(-50%) !important;
	}
	body.portrait .home-grid {
	  grid-template-columns: 1fr 1fr !important;
	  gap: 6px !important;
	}
	body.portrait .home-tile-row {
	  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
	  gap: 6px !important;
	}
	body.portrait .home-hero {
	  min-height: 200px;
	  padding: 12px;
	}
	body.portrait .home-card {
	  min-height: 90px;
	  padding: 10px;
	}
	body.portrait .home-grid {
	  grid-template-columns: 1fr 1fr;
	  gap: 6px;
	}
	body.portrait .home-rail {
	  margin-top: 8px;
	}
	body.portrait #top-right {
	  top: calc(var(--safe-area-top) + 8px) !important;
	  right: calc((100vw - min(100vw - 20px, 480px)) / 2 + 6px) !important;
	}
	body.portrait #toast {
	  top: calc(var(--safe-area-top) + 44px) !important;
	}
	body.portrait #playlist-panel {
	  max-height: 55dvh !important;
	}

/* Mobile server connection indicator */
#mobile-server-indicator {
  position: fixed;
  top: calc(var(--safe-area-top) + 4px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  background: rgba(255,83,103,0.9);
  color: #fff;
  font-size: 12px;
  padding: 4px 14px;
  border-radius: 999px;
  display: none;
  pointer-events: none;
  font-family: var(--font-sans);
}
#mobile-server-indicator.show {
  display: block;
  animation: mobilePulse 1.5s ease-in-out infinite;
}
@keyframes mobilePulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

/* Mobile navigation tabs — auto-hiding */
#mobile-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) translateY(0);
  z-index: 800;
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: min(100vw, 480px);
  height: calc(52px + var(--safe-area-bottom));
  padding: 4px 8px calc(4px + var(--safe-area-bottom)) 8px;
  background: rgba(8,10,14,0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255,255,255,0.06);
  border-radius: 18px 18px 0 0;
  transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.35s ease;
  pointer-events: auto;
}
#mobile-nav.hidden {
  transform: translateX(-50%) translateY(calc(100% + 20px));
  opacity: 0;
  pointer-events: none;
}
.mobile-nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 100%;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.4);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: color 0.2s;
  font-family: var(--font-sans);
  padding: 0;
  min-height: 0;
}
.mobile-nav-btn.active {
  color: var(--fc-accent);
}
.mobile-nav-btn svg {
  width: 20px;
  height: 20px;
}
/* Touch hint zone at bottom to reveal nav */
#mobile-nav-trigger {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 24px;
  z-index: 799;
  pointer-events: auto;
}

/* Adjust player for mobile nav */
body.has-mobile-nav #player-controls-strip {
  bottom: calc(56px + var(--safe-area-bottom));
}

/* Mobile connect screen removed — server URL is now pre-configured or set via settings */

/* Mobile login panel removed — use original QR code / cookie login instead */
`;

// 0. Fix viewport meta for mobile (no zoom, no scale)
html = html.replace(
  '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
  '<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover">'
);

// 0b. Inject PWA manifest link
html = html.replace('<title>Mineradio</title>', '<title>Mineradio</title>\n<link rel="manifest" href="/assets/manifest.json">');

html = html.replace('</style>', mobileCSS + '\n</style>');

// ============================================================
// 2. Inject mobile JS after 'use strict';
// ============================================================
const mobileJS = `
// ===== MINERADIO MOBILE INIT =====
(function() {
  'use strict';

  // -- Platform detection --
  var isCapacitor = !!(window.Capacitor && window.Capacitor.isNativePlatform());
  var isMobileBrowser = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);
  var isMobile = isCapacitor || isMobileBrowser;

  // -- Server configuration (saved to localStorage) --
  var STORAGE_KEY_SERVER = 'mineradio-mobile-server-url';

  window.getMobileServerUrl = function() {
    return localStorage.getItem(STORAGE_KEY_SERVER) || '';
  };
  window.setMobileServerUrl = function(url) {
    url = (url || '').replace(/\\/+$/, '');
    localStorage.setItem(STORAGE_KEY_SERVER, url);
    return url;
  };

  // API requests use same-origin (same as original desktop app)
  // No fetch/XHR patching needed — server and frontend are deployed together

  // -- Mobile body class --
  if (isMobile) {
    document.body.classList.add('mobile-device');
    document.body.classList.add('has-mobile-nav');
  }

  // -- Force mobile layout (app JS overrides CSS, so we fight back with JS) --
  if (isMobile) {
    function forceMobileLayout() {
      var home = document.getElementById('empty-home');
      var topRight = document.getElementById('top-right');
      var st = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-top')) || 0;
      var sb = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-bottom')) || 0;
      var isP = window.innerHeight > window.innerWidth;
      var homeTop = st + (isP ? 62 : 68);
      var homeBottom = sb + 52;
      if (home && home.offsetParent !== null) {
        home.style.setProperty('top', homeTop + 'px', 'important');
        home.style.setProperty('bottom', homeBottom + 'px', 'important');
        home.style.setProperty('left', '50%', 'important');
        home.style.setProperty('transform', 'translateX(-50%)', 'important');
        home.style.setProperty('width', 'calc(100vw - ' + (isP ? 16 : 20) + 'px)', 'important');
        home.style.setProperty('position', 'fixed', 'important');
      }
      if (topRight) {
        topRight.style.setProperty('top', (st + 8) + 'px', 'important');
        topRight.style.setProperty('right', '12px', 'important');
        topRight.style.setProperty('position', 'fixed', 'important');
      }
    }
    // Run after app init, and on every resize/orientation change
    setTimeout(forceMobileLayout, 300);
    setTimeout(forceMobileLayout, 1200);
    setTimeout(forceMobileLayout, 3000);
    window.addEventListener('resize', function() {
      clearTimeout(window._forceLayoutTimer);
      window._forceLayoutTimer = setTimeout(forceMobileLayout, 200);
    });
    // Also observe DOM changes for when home becomes visible
    var homeEl = document.getElementById('empty-home');
    if (homeEl) {
      var observer = new MutationObserver(function() {
        if (homeEl.style.opacity !== '0' && homeEl.offsetParent !== null) {
          setTimeout(forceMobileLayout, 100);
        }
      });
      observer.observe(homeEl, { attributes: true, attributeFilter: ['style', 'class'] });
    }
  }

  // -- Remove desktop shell classes --
  document.documentElement.classList.remove('desktop-shell-root');
  document.body.classList.remove('desktop-shell');

  // -- Mobile Three.js optimizations --
  if (isMobile) {
    // Reduce pixel ratio for mobile GPU
    window.MOBILE_PIXEL_RATIO = Math.min(window.devicePixelRatio || 2, 2);
    window.MOBILE_PARTICLE_SCALE = window.innerWidth < 480 ? 0.5 : 0.7;
  }

  // -- Capacitor bridge --
  window.MineradioMobile = {
    isMobile: isMobile,
    isCapacitor: isCapacitor,
    platform: isCapacitor ? window.Capacitor.getPlatform() : (isMobileBrowser ? 'browser' : 'desktop'),
    getServerUrl: window.getMobileServerUrl,
    setServerUrl: window.setMobileServerUrl,
    reconnect: function(url) {
      window.setMobileServerUrl(url);
      // Trigger a re-login check
      if (typeof checkLoginStatus === 'function') {
        loginStatusChecked = false;
        checkLoginStatus();
      }
    },
  };

  // Server connection setup UI removed — app now uses same-origin or pre-configured server URL
  // To change server URL, use the settings panel or call window.MineradioMobile.reconnect(url)

  // -- Mobile navigation bar --
  function createMobileNav() {
    if (document.getElementById('mobile-nav')) return;
    if (!isMobile) return;

    var nav = document.createElement('nav');
    nav.id = 'mobile-nav';
    nav.className = 'hidden'; // Start hidden
    nav.innerHTML =
      '<button class="mobile-nav-btn active" data-tab="home">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' +
        '<span>首页</span>' +
      '</button>' +
      '<button class="mobile-nav-btn" data-tab="search">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
        '<span>搜索</span>' +
      '</button>' +
      '<button class="mobile-nav-btn" data-tab="playlist">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>' +
        '<span>歌单</span>' +
      '</button>' +
      '<button class="mobile-nav-btn" data-tab="settings">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>' +
        '<span>设置</span>' +
      '</button>';

    document.body.appendChild(nav);

    // Touch trigger zone at screen bottom — tap to show/hide nav
    var trigger = document.createElement('div');
    trigger.id = 'mobile-nav-trigger';
    document.body.appendChild(trigger);

    var navHideTimer = null;
    function showNav() {
      nav.classList.remove('hidden');
      clearTimeout(navHideTimer);
      navHideTimer = setTimeout(function() { nav.classList.add('hidden'); }, 4000);
    }
    function hideNav() {
      nav.classList.add('hidden');
      clearTimeout(navHideTimer);
    }

    // Tap bottom area to toggle nav
    trigger.addEventListener('click', function(e) {
      e.stopPropagation();
      if (nav.classList.contains('hidden')) showNav();
      else hideNav();
    });

    // Show nav on any touch near bottom third of screen
    document.addEventListener('touchstart', function(e) {
      if (e.touches.length === 1 && e.touches[0].clientY > window.innerHeight * 0.75) {
        showNav();
      }
    }, { passive: true });

    // Also show on mousedown (for testing on desktop)
    document.addEventListener('mousedown', function(e) {
      if (e.clientY > window.innerHeight * 0.85) showNav();
    });

    // Show nav on first load, then auto-hide
    setTimeout(function() { showNav(); }, 1200);

    // Tab switching
    nav.querySelectorAll('.mobile-nav-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        nav.querySelectorAll('.mobile-nav-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var tab = btn.dataset.tab;
        switch(tab) {
          case 'home':
            if (typeof navigateHome === 'function') navigateHome();
            break;
          case 'search':
            var searchArea = document.getElementById('search-area');
            if (searchArea) {
              searchArea.classList.add('peek');
              var input = searchArea.querySelector('input');
              if (input) setTimeout(function() { input.focus(); }, 300);
            }
            showNav();
            break;
          case 'playlist':
            if (typeof togglePlaylistPanel === 'function') togglePlaylistPanel();
            showNav();
            break;
          case 'settings':
            if (typeof toggleSettingsPanel === 'function') toggleSettingsPanel();
            showNav();
            break;
        }
      });
    });
  }

  if (isMobile) {
    setTimeout(createMobileNav, 800);
  }

  // -- Orientation change handler --
  function handleOrientationChange() {
    var isPortrait = window.innerHeight > window.innerWidth;
    document.body.classList.toggle('portrait', isPortrait);
    document.body.classList.toggle('landscape', !isPortrait);

    // Force Three.js renderer resize if available
    if (typeof renderer !== 'undefined' && renderer) {
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 2, 2));
    }
    if (typeof camera !== 'undefined' && camera) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }

    // Show nav on orientation change
    var nav = document.getElementById('mobile-nav');
    if (nav) {
      nav.classList.remove('hidden');
      clearTimeout(window._navHideTimer);
      window._navHideTimer = setTimeout(function() { nav.classList.add('hidden'); }, 4000);
    }
  }

  window.addEventListener('orientationchange', function() {
    setTimeout(handleOrientationChange, 300);
  });
  window.addEventListener('resize', function() {
    // Debounce
    clearTimeout(window._resizeTimer);
    window._resizeTimer = setTimeout(handleOrientationChange, 250);
  });

  // Initial orientation
  if (isMobile) {
    setTimeout(handleOrientationChange, 600);
  }

  // -- Handle back button on Android --
  if (isCapacitor) {
    window.addEventListener('popstate', function(e) {
      var panels = document.querySelectorAll('.panel.open, .overlay.open');
      if (panels.length > 0) {
        var top = panels[panels.length - 1];
        var closeBtn = top.querySelector('.close-btn, [data-close]');
        if (closeBtn) closeBtn.click();
        e.preventDefault();
      }
    });
  }

  // -- Auto-dismiss splash screen on mobile --
  if (isMobile) {
    var splashAutoDismissAttempts = 0;
    var splashAutoDismissTimer = setInterval(function() {
      splashAutoDismissAttempts++;
      // Try calling dismissSplash (defined by the original app)
      if (typeof dismissSplash === 'function') {
        dismissSplash();
        clearInterval(splashAutoDismissTimer);
        console.log('[Mineradio Mobile] Splash auto-dismissed');
        return;
      }
      // Fallback: manually remove splash if the function isn't available yet
      var splash = document.getElementById('splash');
      if (splash && document.body.classList.contains('splash-active')) {
        document.body.classList.remove('splash-active', 'splash-revealing');
        splash.classList.add('hide');
        splash.style.display = 'none';
        clearInterval(splashAutoDismissTimer);
        console.log('[Mineradio Mobile] Splash forcefully removed');
        return;
      }
      // Give up after 10 seconds
      if (splashAutoDismissAttempts > 40) {
        clearInterval(splashAutoDismissTimer);
      }
    }, 250);
  }

  // Mobile login panel removed — use original QR code / cookie login from server.js

  console.log('[Mineradio Mobile] Initialized. Platform:', window.MineradioMobile.platform);
  console.log('[Mineradio Mobile] Server: same-origin (no configuration needed)');
})();
`;

html = html.replace("'use strict';", "'use strict';\n" + mobileJS);

// ============================================================
// 3. Write output
// ============================================================
fs.mkdirSync(path.dirname(destPath), { recursive: true });
fs.writeFileSync(destPath, html, 'utf8');
console.log('✅ Mobile-adapted index.html written to', destPath);
console.log('   Original size:', (fs.statSync(srcPath).size / 1024).toFixed(0), 'KB');
console.log('   Adapted size:', (fs.statSync(destPath).size / 1024).toFixed(0), 'KB');
