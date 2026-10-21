import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { finishPageLoading } from './loading';

gsap.registerPlugin(ScrollTrigger);
const pageReady = finishPageLoading();

const header = document.querySelector<HTMLElement>('.site-header');
const menuButton = document.querySelector<HTMLButtonElement>('.menu-toggle');
const mobileNav = document.querySelector<HTMLElement>('#mobile-nav');
const privacy = document.querySelector<HTMLDialogElement>('#privacy-dialog');
const dock = document.querySelector<HTMLElement>('.mobile-dock');
const hero = document.querySelector<HTMLElement>('.hero');
const visit = document.querySelector<HTMLElement>('#visit');
let lenis: Lenis | undefined;
let lastDialogTrigger: HTMLElement | null = null;

function setMenu(open: boolean, returnFocus = false) {
  if (!menuButton || !mobileNav) return;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.querySelector('.menu-toggle__label')!.textContent = open ? '閉じる' : 'メニュー';
  mobileNav.hidden = !open;
  document.body.classList.toggle('menu-open', open);
  if (open) lenis?.stop(); else if (!document.querySelector('dialog[open]')) lenis?.start();
  if (!open && returnFocus) menuButton.focus();
}

menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  if (event.key !== 'Tab' || mobileNav?.hidden || !mobileNav || !menuButton) return;
  const links = [...mobileNav.querySelectorAll<HTMLAnchorElement>('a')];
  const last = links.at(-1);
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); menuButton.focus(); }
  if (event.shiftKey && document.activeElement === menuButton && last) { event.preventDefault(); last.focus(); }
});

document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  if (!target.closest('.site-header') && menuButton?.getAttribute('aria-expanded') === 'true') setMenu(false);
  const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
  if (!anchor) return;
  const href = anchor.getAttribute('href');
  if (!href || href === '#') return;
  const section = document.getElementById(href.slice(1));
  if (!section) return;
  event.preventDefault();
  setMenu(false);
  const offset = (header?.offsetHeight ?? 82) + 22;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Replace the URL without creating a scroll restoration race with Lenis.
  if (location.hash !== href) history.pushState(null, '', href);
  if (lenis) lenis.scrollTo(section, { offset: -offset, immediate: reduced });
  else window.scrollTo({ top: Math.max(0, section.getBoundingClientRect().top + window.scrollY - offset), behavior: reduced ? 'instant' : 'smooth' });
  // The skip link must move keyboard focus as well as the viewport.
  if (anchor.classList.contains('skip-link')) {
    section.setAttribute('tabindex', '-1');
    section.focus({ preventScroll: true });
    section.addEventListener('blur', () => section.removeAttribute('tabindex'), { once: true });
  }
});

function updateScrollUi() {
  header?.classList.toggle('is-scrolled', window.scrollY > 25);
  if (!dock || !hero || !visit) return;
  const show = window.matchMedia('(max-width: 760px)').matches &&
    hero.getBoundingClientRect().bottom < 0 &&
    visit.getBoundingClientRect().top > window.innerHeight - 80;
  dock.hidden = !show;
  dock.inert = !show;
}
window.addEventListener('scroll', updateScrollUi, { passive: true });
window.addEventListener('resize', () => {
  if (window.innerWidth > 980) setMenu(false);
  updateScrollUi();
}, { passive: true });
updateScrollUi();

document.querySelector<HTMLButtonElement>('.privacy-open')?.addEventListener('click', event => {
  if (!privacy) return;
  setMenu(false);
  lastDialogTrigger = event.currentTarget as HTMLElement;
  privacy.showModal();
  document.body.classList.add('dialog-open');
  lenis?.stop();
});
function closePrivacy() { privacy?.close(); }
privacy?.querySelectorAll<HTMLButtonElement>('.privacy-close').forEach(button => button.addEventListener('click', closePrivacy));
privacy?.addEventListener('click', event => { if (event.target === privacy) closePrivacy(); });
privacy?.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  lenis?.start();
  lastDialogTrigger?.focus();
});

// All supplied photographs stay available without JS. With JS, start with six
// quiet thumbnails and let visitors choose the rest or a full-size photograph.
const albumPhotos = [...document.querySelectorAll<HTMLAnchorElement>('[data-gallery-photo]')];
const albumToggle = document.querySelector<HTMLButtonElement>('.album-toggle');
const photoDialog = document.querySelector<HTMLDialogElement>('#photo-dialog');
const fullPhoto = photoDialog?.querySelector<HTMLImageElement>('.photo-dialog__image');
let galleryIndex = 0;
let galleryTrigger: HTMLAnchorElement | undefined;
if (albumToggle && albumPhotos.length > 6) {
  albumPhotos.forEach((photo, index) => { photo.hidden = index >= 6; });
  albumToggle.hidden = false;
  albumToggle.addEventListener('click', () => {
    const expanded = albumToggle.getAttribute('aria-expanded') !== 'true';
    albumPhotos.forEach((photo, index) => { photo.hidden = !expanded && index >= 6; });
    albumToggle.setAttribute('aria-expanded', String(expanded));
    albumToggle.querySelector('span')!.textContent = expanded ? '写真を6枚に戻す' : `すべての写真を見る（${albumPhotos.length}枚）`;
    ScrollTrigger.refresh();
    lenis?.resize();
    updateScrollUi();
  });
}
function showPhoto(index: number) {
  if (!fullPhoto || !photoDialog || !albumPhotos.length) return;
  galleryIndex = (index + albumPhotos.length) % albumPhotos.length;
  const photo = albumPhotos[galleryIndex];
  fullPhoto.src = photo.dataset.gallerySrc!;
  fullPhoto.alt = photo.dataset.galleryAlt!;
  photoDialog.querySelector('.photo-counter')!.textContent = `${galleryIndex + 1} / ${albumPhotos.length}`;
}
albumPhotos.forEach((photo, index) => photo.addEventListener('click', event => {
  if (!photoDialog) return;
  event.preventDefault();
  galleryTrigger = photo;
  showPhoto(index);
  photoDialog.showModal();
  document.body.classList.add('dialog-open');
  lenis?.stop();
}));
photoDialog?.querySelector('.photo-dialog__close')?.addEventListener('click', () => photoDialog.close());
photoDialog?.querySelector('.photo-prev')?.addEventListener('click', () => showPhoto(galleryIndex - 1));
photoDialog?.querySelector('.photo-next')?.addEventListener('click', () => showPhoto(galleryIndex + 1));
photoDialog?.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    showPhoto(galleryIndex + (event.key === 'ArrowLeft' ? -1 : 1));
  }
});
photoDialog?.addEventListener('click', event => { if (event.target === photoDialog) photoDialog.close(); });
photoDialog?.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  lenis?.start();
  galleryTrigger?.focus({ preventScroll: true });
});

// Native details remain usable without JS. GSAP enhances opening only, so rapid
// toggles and keyboard closing cannot leave an answer trapped at zero height.
document.querySelectorAll<HTMLDetailsElement>('[data-disclosure]').forEach(details => {
  const content = details.querySelector<HTMLElement>('.disclosure-content');
  details.addEventListener('toggle', () => {
    if (content) {
      gsap.killTweensOf(content);
      if (details.open && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.fromTo(content, { opacity: 0, y: -4 }, { opacity: 1, y: 0, duration: .24, clearProps: 'opacity,transform' });
      } else gsap.set(content, { clearProps: 'opacity,transform' });
    }
    ScrollTrigger.refresh();
    lenis?.resize();
  });
});

const media = gsap.matchMedia();
media.add({ desktop: '(min-width: 761px)', mobile: '(max-width: 760px)', reduced: '(prefers-reduced-motion: reduce)' }, context => {
  const { desktop, reduced } = context.conditions!;
  if (reduced) return;

  let ticker: ((time: number) => void) | undefined;
  if (desktop) {
    const instance = new Lenis({ duration: .82, smoothWheel: true, syncTouch: false, anchors: false });
    lenis = instance;
    instance.on('scroll', ScrollTrigger.update);
    ticker = time => instance.raf(time * 1000);
    gsap.ticker.add(ticker);
  }

  let active = true;
  const intro = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } });
  intro.fromTo('.hero-image', { scale: 1.025 }, { scale: 1, duration: 1.1, clearProps: 'transform' }, 0);
  intro.fromTo('.hero-title-line', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .7, stagger: .09, clearProps: 'opacity,transform' }, .08);
  pageReady.then(() => { if (active) intro.play(); });

  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(element => {
    if (element.getBoundingClientRect().top < window.innerHeight * .9) return;
    gsap.fromTo(element, { y: desktop ? 22 : 12, opacity: 0 }, {
      y: 0, opacity: 1, duration: .65, ease: 'power2.out', clearProps: 'opacity,transform',
      scrollTrigger: { trigger: element, start: 'top 92%', once: true },
    });
  });

  if (desktop) {
    // The inner frame clips the very small translation, preserving the crop.
    gsap.to('.hero-image', { y: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .7 } });
    gsap.fromTo('.steps-line>span', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.adoption-steps', start: 'top 70%', end: 'bottom 65%', scrub: .4 } });
  }

  return () => {
    active = false;
    if (ticker) gsap.ticker.remove(ticker);
    lenis?.destroy();
    lenis = undefined;
    updateScrollUi();
  };
});

const refreshLayout = () => { ScrollTrigger.refresh(); lenis?.resize(); updateScrollUi(); };
pageReady.then(refreshLayout);
if (document.readyState === 'complete') refreshLayout();
else window.addEventListener('load', refreshLayout, { once: true });
document.fonts.ready.then(refreshLayout);
window.addEventListener('pageshow', refreshLayout);

// A details answer, responsive text, or loaded image can change the document.
const resize = new ResizeObserver(() => { lenis?.resize(); });
resize.observe(document.body);
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  media.revert();
  resize.disconnect();
});
