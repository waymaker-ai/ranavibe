/* Optional, page-view-only analytics. No form data, query strings or saved work. */
(() => {
  'use strict';
  const config = {"repo":"waymaker-ai/ranavibe","folder":"website/public","id":"G-B6571FFVR6","hosts":["cofounder.cx","www.cofounder.cx"],"name":"CoFounder","privacy":"/privacy","exclude":["^/(?:dashboard|playground|account|admin|login|auth|api)(?:/|$)"]};
  if (!config.hosts.includes(location.hostname)) return;
  const key = 'optional-analytics-v1';
  let choice = '';
  try { choice = localStorage.getItem(key) || ''; } catch {}
  let loaded = false;
  let lastPath = '';
  const allowed = () => {
    const path = location.pathname.replace(/\/+$/, '') || '/';
    if (config.allow && !config.allow.some(pattern => new RegExp(pattern).test(path))) return false;
    return !config.exclude.some(pattern => new RegExp(pattern).test(path));
  };
  const clearCookies = () => {
    for (const entry of document.cookie.split(';')) {
      const name = entry.split('=')[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) continue;
      for (const domain of ['', location.hostname, '.' + location.hostname]) {
        document.cookie = name + '=; Max-Age=0; path=/;' + (domain ? ' domain=' + domain + ';' : '') + ' SameSite=Lax';
      }
    }
  };
  const pageview = () => {
    const enabled = choice === 'granted' && allowed();
    window['ga-disable-' + config.id] = !enabled;
    if (!enabled) { lastPath = ''; return; }
    const page = location.origin + location.pathname;
    if (loaded && lastPath === page) return;
    if (!loaded) {
      loaded = true;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('consent', 'default', {analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
      window.gtag('js', new Date());
      window.gtag('config', config.id, {send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false});
      const tag = document.createElement('script');
      tag.async = true;
      tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + config.id;
      document.head.append(tag);
    }
    lastPath = page;
    // No referrer/query/hash or dynamically generated title is transmitted.
    window.gtag('set', {page_location:page,page_referrer:'',page_title:config.name});
    window.gtag('event', 'page_view', {send_to:config.id,page_location:page,page_referrer:'',page_title:config.name});
  };
  const init = () => {
    const panel = document.createElement('section');
    panel.setAttribute('aria-label', 'Analytics preferences');
    panel.style.cssText = 'position:fixed;bottom:16px;left:16px;z-index:10000;max-width:min(480px,calc(100vw - 32px));padding:20px;border:1px solid #d1d5db;border-radius:14px;background:#fff;color:#17212b;box-shadow:0 8px 32px #0002;font:15px/1.5 Arial,sans-serif;text-align:left';
    const copy = document.createElement('p');
    copy.textContent = config.adults ? 'Adults can optionally allow Google Analytics on our book information and gift-guide pages. Reading, family planning, saved lists and product choices stay untracked.' : 'Help us improve this site? Optional Google Analytics measures public page visits. It stays off until you allow it. Your form answers and saved work are not collected.';
    copy.style.margin = '0 0 12px';
    panel.append(copy);
    const privacy = document.createElement('a');
    privacy.href = config.privacy;
    privacy.textContent = 'Privacy details';
    privacy.style.cssText = 'display:block;text-decoration:underline;margin-bottom:12px;color:inherit';
    panel.append(privacy);
    const settings = document.createElement('button');
    settings.type = 'button';
    settings.textContent = 'Analytics settings';
    settings.style.cssText = 'font:inherit;padding:8px 12px;margin:12px;background:#fff;color:#17212b;border:1px solid #9ca3af;border-radius:6px;cursor:pointer';
    settings.addEventListener('click', () => { panel.hidden = false; panel.querySelector('button').focus(); });
    for (const [value,label] of [['denied','Decline analytics'],['granted',config.adults ? 'I am an adult — allow analytics' : 'Allow analytics']]) {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = label;
      button.style.cssText = 'font:inherit;padding:10px 14px;margin:4px 8px 4px 0;border:1px solid #17212b;border-radius:6px;cursor:pointer;background:' + (value === 'granted' ? '#17212b;color:#fff' : '#fff;color:#17212b');
      button.addEventListener('click', () => {
        choice = value;
        try { localStorage.setItem(key, choice); } catch {}
        panel.hidden = true;
        if (choice === 'denied') { window['ga-disable-' + config.id] = true; clearCookies(); if (loaded) { location.reload(); return; } }
        pageview(); settings.focus();
      });
      panel.append(button);
    }
    document.body.append(panel);
    (document.querySelector('footer') || document.body).append(settings);
    const sync = () => { const safe = allowed(); panel.hidden = !safe || choice !== ''; settings.hidden = !safe; pageview(); };
    window.addEventListener('wm:analytics-route', sync);
    window.addEventListener('popstate', sync);
    sync();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
})();
