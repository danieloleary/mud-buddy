import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'public', 'assets');
await fs.mkdir(outDir, { recursive: true });

const specs = [
  { file: 'hero-civic-water.webp', width: 1600, height: 980, title: 'Mud Buddy', subtitle: 'Browser-local EBMUD water report', mood: 'hero' },
  { file: 'report-preview-redacted.webp', width: 1400, height: 920, title: 'Private report ready', subtitle: 'Baseline, seasonal lift, and next checks', mood: 'report' },
  { file: 'sample-report-montage.webp', width: 1500, height: 900, title: 'Water-use story', subtitle: 'Synthetic sample dashboards and homeowner clues', mood: 'montage' },
  { file: 'irrigation-season-story.webp', width: 1200, height: 820, title: 'Irrigation season', subtitle: 'Find controller drift before it becomes normal', mood: 'garden' },
  { file: 'leak-check-next-steps.webp', width: 1200, height: 820, title: 'Simple fixture checks', subtitle: 'Toilet dye test, meter test, and calm next steps', mood: 'fixture' },
  { file: 'github-social-card.png', width: 1200, height: 630, title: 'Mud Buddy for EBMUD', subtitle: 'Upload CSV. Analyze in browser. Save water and money.', mood: 'social', type: 'png' },
  { file: 'favicon-32.png', width: 32, height: 32, title: '', subtitle: '', mood: 'icon', type: 'png' },
  { file: 'apple-touch-icon.png', width: 180, height: 180, title: '', subtitle: '', mood: 'icon', type: 'png' }
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

function mimeFor(spec) {
  return spec.type === 'png' ? 'image/png' : 'image/webp';
}

for (const spec of specs) {
  const dataUrl = await page.evaluate(({ spec, mime }) => {
    const canvas = document.createElement('canvas');
    canvas.width = spec.width;
    canvas.height = spec.height;
    const ctx = canvas.getContext('2d');
    const W = spec.width;
    const H = spec.height;
    const colors = {
      navy: '#003f5c',
      teal: '#006879',
      aqua: '#6ed6df',
      mint: '#dff7ef',
      sand: '#f4d992',
      green: '#8aaa4f',
      coral: '#c46a4a',
      ink: '#17252a',
      paper: '#fbfcf7'
    };

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#f9fffb');
    grad.addColorStop(0.46, '#e9f8f6');
    grad.addColorStop(1, '#fff7df');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    function circle(x, y, r, fill, alpha = 1) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    function rounded(x, y, w, h, r, fill, stroke = 'rgba(0,63,92,.13)', shadow = true) {
      ctx.save();
      if (shadow) {
        ctx.shadowColor = 'rgba(0,63,92,.14)';
        ctx.shadowBlur = 32;
        ctx.shadowOffsetY = 18;
      }
      ctx.fillStyle = fill;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.stroke();
      ctx.restore();
    }
    function text(value, x, y, size, weight = 800, color = colors.ink, maxWidth = W - x * 2) {
      ctx.fillStyle = color;
      ctx.font = `${weight} ${size}px Source Sans 3, Arial, sans-serif`;
      ctx.fillText(value, x, y, maxWidth);
    }
    function headline(value, x, y, size, color = colors.navy, maxWidth = W - x * 2) {
      ctx.fillStyle = color;
      ctx.font = `900 ${size}px Georgia, serif`;
      ctx.fillText(value, x, y, maxWidth);
    }
    function wave(y, color, alpha = 1) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(8, W / 90);
      ctx.beginPath();
      for (let x = -20; x <= W + 20; x += 24) {
        const yy = y + Math.sin(x / 78) * (H / 45);
        if (x === -20) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
      ctx.restore();
    }
    function bars(x, y, w, h, count = 12) {
      for (let i = 0; i < count; i += 1) {
        const bh = h * (.25 + .62 * Math.abs(Math.sin(i * .72 + 0.7)));
        const bw = w / count * .56;
        const bx = x + i * (w / count) + w / count * .2;
        const by = y + h - bh;
        const g = ctx.createLinearGradient(0, by, 0, y + h);
        g.addColorStop(0, colors.aqua);
        g.addColorStop(1, colors.teal);
        rounded(bx, by, bw, bh, bw / 2, g, 'rgba(255,255,255,.34)', false);
      }
    }

    circle(W * .12, H * .12, W * .18, colors.aqua, .32);
    circle(W * .88, H * .16, W * .14, colors.sand, .38);
    circle(W * .82, H * .86, W * .18, colors.green, .22);
    wave(H * .78, colors.aqua, .34);
    wave(H * .84, colors.teal, .22);

    if (spec.mood === 'icon') {
      const gradIcon = ctx.createLinearGradient(0, 0, W, H);
      gradIcon.addColorStop(0, colors.navy);
      gradIcon.addColorStop(.55, colors.teal);
      gradIcon.addColorStop(1, colors.aqua);
      rounded(W * .08, W * .08, W * .84, H * .84, W * .26, gradIcon, 'rgba(255,255,255,.38)', false);
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.moveTo(W * .5, H * .2);
      ctx.bezierCurveTo(W * .76, H * .48, W * .72, H * .8, W * .5, H * .82);
      ctx.bezierCurveTo(W * .28, H * .8, W * .24, H * .48, W * .5, H * .2);
      ctx.fill();
    } else {
      rounded(W * .07, H * .11, W * .86, H * .76, Math.min(54, W * .045), 'rgba(255,255,255,.76)');
      if (spec.mood === 'social') {
        headline(spec.title, W * .09, H * .25, 70);
        text(spec.subtitle, W * .09, H * .36, 31, 850, colors.teal);
        text('Manual sign-in stays private. No server upload. Not affiliated with EBMUD.', W * .09, H * .47, 24, 800, colors.ink);
        bars(W * .53, H * .23, W * .33, H * .44, 10);
      } else {
        headline(spec.title, W * .1, H * .22, Math.min(64, W / 18));
        text(spec.subtitle, W * .1, H * .30, Math.min(28, W / 48), 850, colors.teal);
        rounded(W * .1, H * .39, W * .32, H * .32, 28, 'rgba(240,250,239,.94)', 'rgba(0,104,121,.18)');
        rounded(W * .49, H * .34, W * .34, H * .38, 32, 'rgba(255,255,255,.92)', 'rgba(0,104,121,.16)');
        bars(W * .53, H * .41, W * .25, H * .20, 8);
        text('Baseline', W * .13, H * .47, Math.min(22, W / 60), 900, colors.navy);
        text('Seasonal lift', W * .13, H * .55, Math.min(22, W / 60), 900, colors.coral);
        text('Next check', W * .13, H * .63, Math.min(22, W / 60), 900, colors.green);
        if (spec.mood === 'garden') {
          circle(W * .68, H * .69, W * .035, colors.green, .95);
          circle(W * .73, H * .66, W * .026, colors.green, .88);
          text('controller + zones', W * .52, H * .68, Math.min(21, W / 62), 850, colors.navy);
        }
        if (spec.mood === 'fixture') {
          text('meter test', W * .52, H * .67, Math.min(21, W / 62), 850, colors.navy);
          circle(W * .77, H * .67, W * .026, colors.aqua, .95);
        }
      }
    }
    return canvas.toDataURL(mime, 0.92);
  }, { spec, mime: mimeFor(spec) });
  const base64 = dataUrl.split(',')[1];
  await fs.writeFile(path.join(outDir, spec.file), Buffer.from(base64, 'base64'));
}

await browser.close();
console.log(`Generated ${specs.length} synthetic public-safe visual assets in ${outDir}`);
