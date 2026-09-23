for (const button of document.querySelectorAll('[data-print]')) {
  button.hidden = false;
  button.addEventListener('click', () => window.print());
}

const chapterLinks = [...document.querySelectorAll('.sidebar a[href^="#"]')];
if ('IntersectionObserver' in window && chapterLinks.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      const visibleChapter = entries.find((entry) => entry.isIntersecting);
      if (!visibleChapter) return;
      for (const link of chapterLinks) {
        if (link.hash === `#${visibleChapter.target.id}`) {
          link.setAttribute('aria-current', 'location');
        } else {
          link.removeAttribute('aria-current');
        }
      }
    },
    { rootMargin: '-15% 0px -65% 0px' },
  );
  document.querySelectorAll('section.chapter').forEach((chapter) => observer.observe(chapter));
}

const screenshotImages = document.querySelectorAll('img[data-screenshot]');
if (screenshotImages.length && typeof HTMLDialogElement !== 'undefined') {
  const dialog = document.createElement('dialog');
  dialog.className = 'image-dialog';
  dialog.setAttribute('aria-label', 'スクリーンショットの拡大');
  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.textContent = '閉じる ×';
  closeButton.addEventListener('click', () => dialog.close());
  const sizeButton = document.createElement('button');
  sizeButton.type = 'button';
  sizeButton.textContent = '原寸で表示';
  sizeButton.setAttribute('aria-pressed', 'false');
  sizeButton.addEventListener('click', () => {
    const originalSize = dialog.classList.toggle('is-original');
    sizeButton.textContent = originalSize ? '全体を表示' : '原寸で表示';
    sizeButton.setAttribute('aria-pressed', String(originalSize));
  });
  const toolbar = document.createElement('div');
  toolbar.className = 'image-dialog-toolbar';
  toolbar.append(sizeButton, closeButton);
  const enlargedImage = document.createElement('img');
  dialog.append(toolbar, enlargedImage);
  document.body.append(dialog);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  for (const screenshot of screenshotImages) {
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'zoom-trigger';
    trigger.setAttribute('aria-label', `${screenshot.alt}（画像を拡大）`);
    screenshot.before(trigger);
    trigger.append(screenshot);
    trigger.addEventListener('click', () => {
      enlargedImage.src = screenshot.src;
      enlargedImage.alt = screenshot.alt;
      dialog.classList.remove('is-original');
      sizeButton.textContent = '原寸で表示';
      sizeButton.setAttribute('aria-pressed', 'false');
      dialog.showModal();
    });
    const hint = trigger.closest('figure').querySelector('.zoom');
    if (hint) hint.hidden = false;
  }
}
