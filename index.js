const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Launching E-Commerce Applications...');

// 1. Start Backend API
const apiPath = path.join(__dirname, 'apps/api/dist/server.js');
let apiProcess = null;

if (fs.existsSync(apiPath)) {
  console.log('📦 Starting Backend API (apps/api/dist/server.js)...');
  apiProcess = spawn('node', [apiPath], {
    cwd: path.join(__dirname, 'apps/api'),
    env: process.env,
    stdio: 'inherit',
  });

  apiProcess.on('error', (err) => {
    console.error('❌ Failed to start API process:', err);
  });
} else {
  console.error(`⚠️ API compiled entry point not found at ${apiPath}.`);
}

// 2. Start Storefront (Next.js)
const storefrontDir = path.join(__dirname, 'apps/storefront');
let storefrontProcess = null;

if (fs.existsSync(storefrontDir)) {
  console.log('🛍️ Starting Storefront Next.js server...');
  storefrontProcess = spawn('npx', ['next', 'start', '-p', process.env.FRONTEND_PORT || '3000'], {
    cwd: storefrontDir,
    env: process.env,
    stdio: 'inherit',
  });

  storefrontProcess.on('error', (err) => {
    console.error('❌ Failed to start Storefront process:', err);
  });
}

function shutdown() {
  console.log('Shutting down services...');
  if (apiProcess) apiProcess.kill();
  if (storefrontProcess) storefrontProcess.kill();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
