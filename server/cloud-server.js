#!/usr/bin/env node
/**
 * Mineradio Cloud Server — 全功能一体化服务器
 * 启动完整 server.js（所有音源: 网易云/酷狗/汽水/QQ/Spotify + DJ分析 + Cuefield + 天气）
 * 同时代理 API 请求（加 CORS）并服务移动端前端（www/）
 *
 * 部署: node server/cloud-server.js
 * 环境变量: PORT, HOST, COOKIE_FILE, QQ_COOKIE_FILE, KUGOU_COOKIE_FILE, QISHUI_COOKIE_FILE, etc.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const STATIC_DIR = process.env.STATIC_DIR || path.join(__dirname, '..', 'www');
const COOKIE_FILE = process.env.COOKIE_FILE || path.join(__dirname, '.cookie');
const QQ_COOKIE_FILE = process.env.QQ_COOKIE_FILE || path.join(__dirname, '.qq-cookie');
const INTERNAL_PORT = parseInt(PORT, 10) + 1;

// ============================================================
// 启动完整 server.js 作为子进程（所有音源 API）
// ============================================================
const childEnv = {
  ...process.env,
  PORT: String(INTERNAL_PORT),
  HOST: '127.0.0.1',
  COOKIE_FILE,
  QQ_COOKIE_FILE,
  // 子进程的静态文件目录可以是任意值（不会被用到，因为云服务器自己处理静态文件）
  STATIC_DIR: process.env.STATIC_DIR || path.join(__dirname, 'public'),
};

const childServer = spawn('node', [path.join(__dirname, 'server.js')], {
  env: childEnv,
  stdio: 'inherit',
});

childServer.on('error', (err) => {
  console.error('[Cloud] Failed to start server.js:', err.message);
  process.exit(1);
});

childServer.on('exit', (code) => {
  console.error('[Cloud] server.js exited with code', code);
  process.exit(code || 0);
});

// ============================================================
// 移动端登录 API（NeteaseCloudMusicApi）
// ============================================================
let NeteaseAPI = null;
try {
  NeteaseAPI = require('NeteaseCloudMusicApi');
} catch (e) {
  console.log('[Cloud] NeteaseCloudMusicApi not available, phone login disabled');
}

function jsonReply(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch (e) { resolve({ raw: body }); }
    });
  });
}

function saveCookie(provider, cookieStr) {
  const file = provider === 'qq' ? QQ_COOKIE_FILE : COOKIE_FILE;
  try {
    fs.writeFileSync(file, cookieStr, 'utf8');
    console.log('[Cloud] Cookie saved for', provider);
    return true;
  } catch (e) {
    console.error('[Cloud] Failed to save cookie:', e.message);
    return false;
  }
}

// ============================================================
// MIME 类型
// ============================================================
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bin': 'application/octet-stream',
  '.wasm': 'application/wasm',
};

// ============================================================
// 主服务器
// ============================================================
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));

  // CORS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // ---- 移动端登录 API ----

  if (url.pathname === '/api/login/cellphone' && req.method === 'POST') {
    if (!NeteaseAPI) {
      jsonReply(res, 500, { code: 500, message: 'NeteaseCloudMusicApi not loaded' });
      return;
    }
    try {
      const body = await readBody(req);
      const { phone, password, captcha, countrycode } = body || {};
      if (!phone || (!password && !captcha)) {
        jsonReply(res, 400, { code: 400, message: '请提供手机号和密码或验证码' });
        return;
      }
      console.log('[Cloud] Phone login:', phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'));
      const CryptoJS = require('crypto-js');
      const loginQuery = {
        phone, countrycode: countrycode || '86',
        timestamp: Date.now(),
      };
      if (captcha) { loginQuery.captcha = captcha; }
      else if (password) { loginQuery.md5_password = CryptoJS.MD5(password).toString(); }
      const result = await NeteaseAPI.login_cellphone(loginQuery);
      if (result.body && result.body.cookie) {
        saveCookie('netease', result.body.cookie);
        jsonReply(res, 200, { code: 200, message: '登录成功', account: result.body.account || {}, profile: result.body.profile || {} });
      } else {
        jsonReply(res, 400, {
          code: (result.body && result.body.code) || -1,
          message: (result.body && result.body.message) || '登录失败',
        });
      }
    } catch (e) {
      console.error('[Cloud] Phone login error:', e);
      jsonReply(res, 500, { code: 500, message: '服务器错误: ' + (e.body && e.body.message || e.message || String(e)) });
    }
    return;
  }

  if (url.pathname === '/api/login/cellphone/captcha' && req.method === 'POST') {
    if (!NeteaseAPI) {
      jsonReply(res, 500, { code: 500, message: 'NeteaseCloudMusicApi not loaded' });
      return;
    }
    try {
      const body = await readBody(req);
      const { phone, countrycode } = body || {};
      if (!phone) { jsonReply(res, 400, { code: 400, message: '请提供手机号' }); return; }
      const sent = await NeteaseAPI.captcha_sent({
        cellphone: phone, ctcode: countrycode || '86', timestamp: Date.now(),
      });
      jsonReply(res, 200, {
        code: (sent.body && sent.body.code) || 200,
        message: (sent.body && sent.body.code === 200) ? '验证码已发送' : (sent.body && sent.body.message || '发送失败'),
      });
    } catch (e) {
      console.error('[Cloud] SMS error:', e);
      jsonReply(res, 500, { code: 500, message: '发送失败: ' + (e.body && e.body.message || e.message || String(e)) });
    }
    return;
  }

  if (url.pathname === '/api/login/mobile-status' && req.method === 'GET') {
    let nc = '', qc = '';
    try { nc = fs.readFileSync(COOKIE_FILE, 'utf8').trim(); } catch (e) {}
    try { qc = fs.readFileSync(QQ_COOKIE_FILE, 'utf8').trim(); } catch (e) {}
    jsonReply(res, 200, {
      netease: { hasCookie: !!nc, cookieLen: nc.length },
      qq: { hasCookie: !!qc, cookieLen: qc.length },
    });
    return;
  }

  if (url.pathname === '/api/login/cookie' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const { provider, cookie } = body || {};
      if (!cookie) { jsonReply(res, 400, { code: 400, message: '请提供cookie' }); return; }
      const ok = saveCookie(provider || 'netease', cookie);
      jsonReply(res, 200, { code: 200, message: ok ? 'Cookie已保存' : '保存失败' });
    } catch (e) {
      jsonReply(res, 500, { code: 500, message: e.message });
    }
    return;
  }

  // ---- 代理所有 /api/* 请求到完整 server.js ----
  if (url.pathname.startsWith('/api/')) {
    const options = {
      hostname: '127.0.0.1',
      port: INTERNAL_PORT,
      path: url.pathname + url.search,
      method: req.method,
      headers: { ...req.headers, host: '127.0.0.1:' + INTERNAL_PORT },
    };

    const proxy = http.request(options, (proxyRes) => {
      const headers = {
        ...proxyRes.headers,
        'Access-Control-Allow-Origin': '*',
      };
      res.writeHead(proxyRes.statusCode, headers);
      proxyRes.pipe(res);
    });

    proxy.on('error', (err) => {
      console.error('[Cloud] Proxy error:', err.message);
      jsonReply(res, 502, { error: 'API server not available', code: 502 });
    });

    req.pipe(proxy);
    return;
  }

  // ---- 静态文件服务（移动端前端 www/）----
  let filePath = path.join(STATIC_DIR, url.pathname === '/' ? 'index.html' : url.pathname);

  // 安全检查
  if (!filePath.startsWith(STATIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // SPA 回退：目录或不存在的文件 → index.html
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(STATIC_DIR, 'index.html');
  }

  const ext = path.extname(filePath);
  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
    });
    res.end(content);
  } catch (e) {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║        🎵 Mineradio Cloud Server 🎵            ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  全功能 API : http://127.0.0.1:' + String(INTERNAL_PORT).padEnd(5) + '         ║');
  console.log('║  移动端前端 : http://' + HOST + ':' + PORT + '              ║');
  console.log('║  音源: 网易云 | 酷狗 | 汽水 | QQ | Spotify      ║');
  console.log('║  引擎: DJ分析 | Cuefield | 天气电台             ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
});

process.on('SIGINT', () => {
  console.log('\n[Cloud] Shutting down...');
  childServer.kill();
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  childServer.kill();
  server.close();
  process.exit(0);
});