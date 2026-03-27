export function preloadImagesWithProgress(imageUrls, onProgress) {
  const urls = [...new Set((imageUrls ?? []).filter(Boolean))];

  if (urls.length === 0) {
    if (typeof onProgress === 'function') {
      onProgress(100, 0, 0);
    }
    return Promise.resolve();
  }

  const total = urls.length;
  let loaded = 0;

  const reportProgress = () => {
    if (typeof onProgress !== 'function') {
      return;
    }
    const percent = Math.round((loaded / total) * 100);
    onProgress(percent, loaded, total);
  };

  reportProgress();

  return Promise.allSettled(
    urls.map(
      (url) =>
        new Promise((resolve) => {
          const img = new Image();

          const finalize = () => {
            loaded += 1;
            reportProgress();
            resolve();
          };

          img.onload = finalize;
          img.onerror = finalize;
          img.src = url;
        })
    )
  ).then(() => undefined);
}
