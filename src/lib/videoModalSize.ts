import { spacing } from '../theme';

/** Widest the modal card is allowed to get, matching `modalContent.maxWidth`. */
const MAX_CARD_WIDTH = 600;

/** Tallest the player is allowed to get, matching the original fixed height. */
const MAX_VIDEO_HEIGHT = 300;

/**
 * Smallest the player may shrink to. Below this a video is not worth watching,
 * so the modal body scrolls instead of shrinking the player further.
 */
const MIN_VIDEO_HEIGHT = 120;

/**
 * Everything the card holds besides the player: the overlay's padding, the
 * card's own padding, the header (an 18px title plus its margin) and the CLOSE
 * button (12px of padding above and below a 14px label, plus its margin).
 */
export const VIDEO_MODAL_CHROME_HEIGHT = spacing.md * 2 + spacing.lg * 2 + 38 + 57;

/**
 * Size the YouTube player inside a movement-video modal.
 *
 * The player used to be a fixed 300px tall. Together with the chrome above that
 * stacks to roughly 475px, which overflows a phone in landscape (~330-390px of
 * viewport). The overlay centres its card and did not scroll, so the overflow
 * was split top and bottom and clipped *both* dismiss controls off-screen,
 * leaving the modal impossible to close on web.
 *
 * Height is capped three ways: the original 300px, a 16:9 fit for the width we
 * actually have, and whatever the viewport has left once the chrome is paid
 * for. The last cap is what keeps the CLOSE button on screen. It is floored at
 * MIN_VIDEO_HEIGHT, which can still overflow a very short viewport, so the
 * modal body scrolls as well — the floor trades a scroll for a usable player.
 */
export function videoModalSize(width: number, height: number): { width: number; height: number } {
  // The card is inset by the overlay's padding, then by its own padding.
  const videoWidth = Math.min(MAX_CARD_WIDTH, width - spacing.md * 2) - spacing.lg * 2;
  const videoHeight = Math.min(
    MAX_VIDEO_HEIGHT,
    Math.round((videoWidth * 9) / 16),
    height - VIDEO_MODAL_CHROME_HEIGHT
  );

  return { width: videoWidth, height: Math.max(MIN_VIDEO_HEIGHT, videoHeight) };
}
