// Immutably sets a nested value, e.g. setPath(obj, 'combat.hp.current', 5)
export function setPath(obj, path, value) {
  const keys = path.split('.');
  const clone = structuredClone(obj);
  let cursor = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    cursor = cursor[keys[i]];
  }
  cursor[keys[keys.length - 1]] = value;
  return clone;
}

export function getPath(obj, path) {
  return path.split('.').reduce((cursor, key) => cursor?.[key], obj);
}

export async function fileToResizedDataUrl(file, maxSize = 320) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}
