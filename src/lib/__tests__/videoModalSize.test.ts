import { videoModalSize, VIDEO_MODAL_CHROME_HEIGHT } from '../videoModalSize';

/** Total height the modal occupies for a given viewport. */
function modalHeight(width: number, height: number): number {
  return VIDEO_MODAL_CHROME_HEIGHT + videoModalSize(width, height).height;
}

describe('videoModalSize', () => {
  // The bug: a fixed 300px player made the modal ~475px tall, which overflows a
  // phone in landscape. The centred, non-scrolling overlay split that overflow
  // top and bottom, clipping the header's X and the CLOSE button off-screen and
  // leaving no way to dismiss the modal on web.
  const viewports = [
    ['iPhone SE landscape', 667, 375],
    ['iPhone 14 landscape', 844, 390],
    ['iPhone 14 landscape, browser chrome', 844, 330],
    ['iPhone 14 portrait', 390, 844],
    ['iPad portrait', 768, 1024],
    ['iPad landscape', 1024, 768],
    ['desktop', 1440, 900],
  ] as const;

  it.each(viewports)('fits the viewport on %s', (_name, width, height) => {
    expect(modalHeight(width, height)).toBeLessThanOrEqual(height);
  });

  it('keeps the player at 16:9 or shorter, so it is never letterboxed', () => {
    for (const [, width, height] of viewports) {
      const size = videoModalSize(width, height);
      expect(size.height).toBeLessThanOrEqual(Math.round((size.width * 9) / 16));
    }
  });

  it('never exceeds the 300px the player was originally fixed at', () => {
    for (const [, width, height] of viewports) {
      expect(videoModalSize(width, height).height).toBeLessThanOrEqual(300);
    }
  });

  it('uses the full 300px where there is room for it', () => {
    expect(videoModalSize(1440, 900).height).toBe(300);
  });

  // Shorter than the chrome plus the floor, so it cannot fit however we size the
  // player. The body scrolls in that case; the player must still be watchable
  // rather than collapsing to nothing or going negative.
  it('falls back to a watchable floor on a viewport too short to fit', () => {
    const size = videoModalSize(568, 200);
    expect(size.height).toBe(120);
  });
});
