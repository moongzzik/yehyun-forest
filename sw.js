// 예현이의 숲 - 오프라인 지원 서비스워커
// [안내] index.html을 고쳐 다시 올릴 때 VERSION 숫자를 올리면 앱이 새 버전으로 바뀌어요
const PREFIX = 'forest-';
const VERSION = PREFIX + 'v16';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
// [수정] 같은 주소의 다른 앱(study-forest) 저장소는 건드리지 않음
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 앱 화면(html): 인터넷이 되면 최신 버전, 안 되면 저장해 둔 버전
  if (req.mode === 'navigate' || (url.origin === location.origin && url.pathname.endsWith('.html'))) {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // 디자인(Tailwind)·글꼴·아이콘: 저장해 둔 것을 먼저 쓰고, 뒤에서 새로 받아 둠
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});
