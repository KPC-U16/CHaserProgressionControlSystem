import { readFile, writeFile } from 'node:fs/promises';

const [htmlPath, screenshotId, imagePath] = process.argv.slice(2);
if (!htmlPath || !screenshotId || !imagePath || !/^[a-z0-9-]+$/.test(screenshotId)) {
  throw new Error(
    '使い方: node scripts/embed-manual-image.mjs <HTML> <画像の識別名> <画像ファイル>',
  );
}

function imageMimeType(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return 'image/png';
  }
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
    return 'image/jpeg';
  }
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  throw new Error('PNG・JPEG・WebPの画像を指定してください。HTMLは変更していません。');
}

const [html, bytes] = await Promise.all([readFile(htmlPath, 'utf8'), readFile(imagePath)]);
const mimeType = imageMimeType(bytes);
const imageTags = html.match(/<img\b[^>]*>/g) ?? [];
const identifier = new RegExp(`\\bdata-screenshot=["']${screenshotId}["']`);
const matches = imageTags.filter((tag) => identifier.test(tag));
if (matches.length !== 1 || !/\bsrc="[^"]*"/.test(matches[0])) {
  throw new Error('対応する画像が一つに特定できません。data-screenshotとsrcを確認してください。');
}

const dataUrl = `data:${mimeType};base64,${bytes.toString('base64')}`;
const updatedTag = matches[0].replace(/\bsrc="[^"]*"/, () => `src="${dataUrl}"`);
await writeFile(
  htmlPath,
  html.replace(matches[0], () => updatedTag),
);
console.log(`${screenshotId} を ${mimeType} (${bytes.length} bytes) で埋め込みました。`);
