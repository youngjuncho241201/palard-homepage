import { defineConfig } from 'vite'
import { resolve } from 'path'
import fs from 'fs'

/* ─────────────────────────────────────────────────────────
   이미지 자동 감지 플러그인
   · npm run dev 시작 때 public/images/ 전체 스캔
   · 이미지를 추가/삭제하면 즉시 manifest 재생성
   · npm run build 시에도 자동으로 실행
───────────────────────────────────────────────────────── */
const IMAGE_EXTS = /\.(jpe?g|png|gif|webp|svg|bmp|avif)$/i;
const IMAGES_DIR = resolve(__dirname, 'public/images');
const MANIFEST   = resolve(__dirname, 'public/image-manifest.json');

function scanImages() {
  if (!fs.existsSync(IMAGES_DIR)) return [];
  return fs.readdirSync(IMAGES_DIR)
    .filter(f => IMAGE_EXTS.test(f))
    .sort((a, b) => a.localeCompare(b, 'ko'));
}

function writeManifest() {
  const list = scanImages();
  fs.writeFileSync(MANIFEST, JSON.stringify(list, null, 2), 'utf-8');
  console.log(`\x1b[36m[PALARD]\x1b[0m image-manifest.json — ${list.length}장 스캔 완료`);
}

function imageManifestPlugin() {
  return {
    name: 'palard-image-manifest',

    // 빌드 시작 시 스캔
    buildStart() {
      writeManifest();
    },

    // 개발 서버 실행 시 스캔 + 폴더 감시
    configureServer(server) {
      writeManifest();

      const handler = (filePath) => {
        const normalized = filePath.replace(/\\/g, '/');
        if (normalized.includes('/public/images/') && IMAGE_EXTS.test(filePath)) {
          writeManifest();
        }
      };

      // 이미지 추가 또는 삭제 감지
      server.watcher.on('add',   handler);
      server.watcher.on('unlink', handler);
    }
  };
}

export default defineConfig({
  plugins: [imageManifestPlugin()],

  /* ── 배포 base 경로 ────────────────────────────────────────────
   * GitHub Pages 프로젝트 페이지:  base = '/palard-homepage/'
   * 커스텀 도메인(palard.co.kr 등): base = '/'  로 변경
   ─────────────────────────────────────────────────────────────── */
  base: process.env.CUSTOM_DOMAIN ? '/' : '/palard-homepage/',

  server: {
    port: 3000,
    open: true
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main:  resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        thankyou: resolve(__dirname, 'thank-you.html')
      }
    }
  }
})
