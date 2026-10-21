/** Wait only for the first view; gallery and other lazy images never block it. */
export async function finishPageLoading(): Promise<void> {
  const root = document.documentElement;
  const loader = document.querySelector<HTMLElement>('[data-page-loader]');
  if (!loader || !root.classList.contains('is-loading')) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const elapsed = performance.now() - Number(root.dataset.pageLoadingAt ?? performance.now());
  const image = document.querySelector<HTMLImageElement>('.hero-image');
  const heroReady = image ? image.decode().catch(() => undefined) : Promise.resolve();
  const assetsReady = Promise.allSettled([heroReady, document.fonts.ready]);
  let deadline: number | undefined;
  const boundedReady = Promise.race([
    assetsReady,
    new Promise<void>(resolve => { deadline = window.setTimeout(resolve, Math.max(0, 2800 - elapsed)); }),
  ]);
  const minimum = new Promise<void>(resolve => window.setTimeout(resolve, Math.max(0, (reduced ? 0 : 2000) - elapsed)));
  await Promise.all([boundedReady, minimum]);
  window.clearTimeout(deadline);

  if (loader.isConnected && root.classList.contains('is-loading') && !reduced) {
    loader.classList.add('is-leaving');
    await new Promise<void>(resolve => window.setTimeout(resolve, 450));
  }
  root.classList.remove('is-loading');
  delete root.dataset.pageLoadingAt;
  loader.remove();
}
