import './style.css';
import imageCompression from 'browser-image-compression';

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;

// 按页面语言切文案(中文页 lang=zh-CN → zh;英文页 lang=en → en)
const L = (document.documentElement.lang || 'zh').toLowerCase().startsWith('en') ? 'en' : 'zh';
const T = {
  zh: {
    pickImg: '请选择图片文件(JPG / PNG / WebP)',
    target: (kb: number) => `目标 ${kb} KB · 点击「压缩图片」`,
    compressing: '正在本地压缩…',
    toJpeg: '转 JPEG 进一步压缩…',
    done: '压缩完成',
    hit: (kb: number, conv: boolean) => `已压到目标 ${kb} KB 以内${conv ? ' · 已转 JPG(透明背景变白)' : ''}`,
    near: (s: string) => `已尽量逼近(${s});再小会明显糊`,
    saved: (r: number) => `省 ${r}%`,
    download: '下载',
    fail: '压缩失败,请换张图片重试',
  },
  en: {
    pickImg: 'Please choose an image (JPG / PNG / WebP)',
    target: (kb: number) => `Target ${kb} KB · click "Compress"`,
    compressing: 'Compressing locally…',
    toJpeg: 'Converting to JPEG to compress further…',
    done: 'Done',
    hit: (kb: number, conv: boolean) => `Compressed to under ${kb} KB${conv ? ' · converted to JPG (transparent → white)' : ''}`,
    near: (s: string) => `Got as close as possible (${s}); smaller would blur noticeably`,
    saved: (r: number) => `saved ${r}%`,
    download: 'Download',
    fail: 'Compression failed — try another image',
  },
}[L];

const fileInput = $<HTMLInputElement>('#fileInput');
const dropzone = $('#dropzone');
const panel = $('#panel');
const presets = $('#presets');
const customKB = $<HTMLInputElement>('#customKB');
const compressBtn = $<HTMLButtonElement>('#compressBtn');
const statusEl = $('#status');
const resultEl = $('#result');
const origMeta = $('#origMeta');

let file: File | null = null;
let targetKB = 100;

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

function fmt(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function setStatus(msg: string, kind: 'ok' | 'err' | '' = '') {
  statusEl.textContent = msg;
  statusEl.className = 'statusline' + (kind ? ' ' + kind : '');
}

function loadFile(f: File) {
  if (!f.type.startsWith('image/')) {
    setStatus(T.pickImg, 'err');
    return;
  }
  file = f;
  const url = URL.createObjectURL(f);
  const img = new Image();
  img.onload = () => {
    origMeta.innerHTML =
      `<img class="op-thumb" src="${url}" alt="" />` +
      `<div class="op-info"><b class="op-name">${f.name}</b>` +
      `<div class="op-line mono">${img.naturalWidth}×${img.naturalHeight} · ${fmt(f.size)}</div></div>`;
  };
  img.src = url;
  (panel as HTMLElement).hidden = false;
  compressBtn.disabled = false;
  resultEl.classList.remove('show');
  resultEl.innerHTML = '';
  setStatus(T.target(targetKB));
}

fileInput.addEventListener('change', () => {
  const f = fileInput.files?.[0];
  if (f) loadFile(f);
  fileInput.value = '';
});
(['dragenter', 'dragover'] as const).forEach((ev) =>
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    dropzone.classList.add('drag');
  }),
);
(['dragleave', 'drop'] as const).forEach((ev) =>
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    if (ev === 'dragleave' && dropzone.contains((e as DragEvent).relatedTarget as Node)) return;
    dropzone.classList.remove('drag');
  }),
);
dropzone.addEventListener('drop', (e) => {
  const f = (e as DragEvent).dataTransfer?.files?.[0];
  if (f) loadFile(f);
});

presets.querySelectorAll('button').forEach((btn) => {
  btn.addEventListener('click', () => {
    presets.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    btn.setAttribute('aria-pressed', 'true');
    targetKB = Number((btn as HTMLElement).dataset.kb);
    customKB.value = '';
    if (file) setStatus(T.target(targetKB));
  });
});
customKB.addEventListener('input', () => {
  const v = Number(customKB.value);
  if (v > 0) {
    targetKB = v;
    presets.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    if (file) setStatus(T.target(targetKB));
  }
});

compressBtn.addEventListener('click', async () => {
  if (!file) return;
  compressBtn.disabled = true;
  resultEl.classList.remove('show');
  setStatus(T.compressing);
  try {
    const opts = { maxSizeMB: targetKB / 1024, useWebWorker: true, maxIteration: 30 };
    let out = await imageCompression(file, opts);
    let converted = false;
    if (out.size > targetKB * 1024 * 1.05 && file.type !== 'image/jpeg') {
      setStatus(T.toJpeg);
      const jpg = await imageCompression(file, { ...opts, fileType: 'image/jpeg' });
      if (jpg.size < out.size) { out = jpg; converted = true; }
    }
    const ratio = Math.max(0, Math.round((1 - out.size / file.size) * 100));
    const hit = out.size <= targetKB * 1024 * 1.05;
    const url = URL.createObjectURL(out);
    const ext = (out.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    const base = file.name.replace(/\.[^.]+$/, '');
    const name = `${base}-${targetKB}kb.${ext}`;
    setStatus(T.done, 'ok');
    const detail = hit ? T.hit(targetKB, converted) : T.near(fmt(out.size));
    resultEl.innerHTML =
      `<span class="r-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg></span>` +
      `<div class="r-text"><b>${fmt(file.size)} → ${fmt(out.size)} · ${T.saved(ratio)}</b>` +
      `<div class="r-detail mono">${detail}</div></div>` +
      `<a class="btn btn-primary" href="${url}" download="${name}">${T.download}</a>`;
    resultEl.classList.add('show');
  } catch (e) {
    setStatus((e as Error).message || T.fail, 'err');
  } finally {
    compressBtn.disabled = false;
  }
});
