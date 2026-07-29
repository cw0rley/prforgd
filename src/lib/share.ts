import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { formatTime } from '../storage/workoutStorage';

const APP_URL = 'https://www.prforgd.com';

// Build the shareable text for a completed result: WOD name, the full workout,
// the result, and a link — separated by blank lines for readability.
export function formatResultText(opts: {
  wodName: string;
  wodId?: string;
  workout?: string; // the full workout description (movements / reps / scheme)
  timeSeconds?: number;
  rounds?: number;
  reps?: number;
  rx?: boolean;
}): string {
  const { wodName, wodId, workout, timeSeconds, rounds, reps, rx } = opts;
  let score = '';
  if (timeSeconds !== undefined) score = formatTime(timeSeconds);
  else if (rounds !== undefined) score = `${rounds} rounds${reps ? ` + ${reps} reps` : ''}`;
  const tag = rx ? 'Rx' : 'Scaled';
  const link = wodId && !wodId.startsWith('custom-') ? `${APP_URL}/wod/${wodId}` : APP_URL;

  // Order: time (name + result) → blank → workout → blank → footer.
  const headline = score ? `${wodName} — ${score} ${tag}` : `${wodName} — ${tag}`;
  const sections: string[] = [headline];
  if (workout && workout.trim()) sections.push(workout.trim());
  sections.push(`Logged on PRForgd 💪\n${link}`);
  // Blank line between each section.
  return sections.join('\n\n');
}

export type ShareOutcome = 'shared' | 'copied' | 'dismissed' | 'error';

// Share text via the native share sheet (iOS/Android) or the Web Share API,
// falling back to the clipboard when no share UI is available (most desktops).
export async function shareResultText(text: string, title = 'My PRForgd result'): Promise<ShareOutcome> {
  if (Platform.OS === 'web') {
    const nav: any = typeof navigator !== 'undefined' ? navigator : undefined;
    // Only use the Web Share sheet on mobile — on desktop it pops the clunky OS
    // share panel (e.g. Windows' "pick a contact"), so copy to clipboard instead.
    const isMobile = nav?.userAgentData
      ? !!nav.userAgentData.mobile
      : /Mobi|Android|iPhone|iPad|iPod/i.test(nav?.userAgent || '');
    if (isMobile && nav?.share) {
      try {
        await nav.share({ title, text });
        return 'shared';
      } catch (e: any) {
        if (e?.name === 'AbortError') return 'dismissed';
        // otherwise fall through to clipboard
      }
    }
    try {
      await Clipboard.setStringAsync(text);
      return 'copied';
    } catch {
      return 'error';
    }
  }

  try {
    const res = await Share.share({ message: text });
    return res.action === Share.dismissedAction ? 'dismissed' : 'shared';
  } catch {
    return 'error';
  }
}
