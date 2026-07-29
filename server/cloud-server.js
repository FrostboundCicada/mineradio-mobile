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
// 辅助函数
// ============================================================
function jsonReply(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
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