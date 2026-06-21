import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TypingBox from '../TypingBox';
import type { GameConfig } from '@/app/utils/types';

// Inject a fixed passage so the target text is fully deterministic.
const PASSAGE = 'the cat';
vi.mock('@/app/utils/textGenerator', () => ({
  generateText: () => PASSAGE,
  generateWordPassage: () => 'extra words here',
}));

const WORDS_CONFIG: GameConfig = {
  mode: 'words',
  wordCount: 2,
  punctuation: false,
  numbers: false,
};

// The result modal (accuracy etc.) also appears in the live header, so scope
// completion assertions to the modal card itself.
async function findResultModal(): Promise<HTMLElement> {
  const heading = await screen.findByText('Test Complete');
  const modal = heading.closest('.max-w-md');
  if (!(modal instanceof HTMLElement)) {
    throw new Error('result modal container not found');
  }
  return modal;
}

describe('TypingBox integration', () => {
  it('updates the live word counter, then opens the result modal on completion', async () => {
    const user = userEvent.setup();
    render(<TypingBox config={WORDS_CONFIG} />);

    // Live word counter starts at 0/2 and no result modal is shown yet.
    expect(screen.getByText('0/2')).toBeInTheDocument();
    expect(screen.queryByText('Test Complete')).not.toBeInTheDocument();

    // After the first word the counter advances to 1.
    await user.keyboard('the');
    expect(screen.getByText('1/2')).toBeInTheDocument();

    // Finish the passage; completing it opens the result modal.
    await user.keyboard(' cat');

    const modal = await findResultModal();
    // All seven chars typed correctly: 100% accuracy, 7/7 characters.
    expect(within(modal).getByText('100%')).toBeInTheDocument();
    expect(within(modal).getByText('7/7')).toBeInTheDocument();
  });

  it('reflects typing errors in the final accuracy', async () => {
    const user = userEvent.setup();
    render(<TypingBox config={WORDS_CONFIG} />);

    // "thx cat" mistypes one char vs "the cat" but still advances the cursor
    // to the end of the passage (length 7), triggering completion.
    await user.keyboard('thx cat');

    const modal = await findResultModal();
    // 6 of 7 correct => round(85.7) => 86%.
    expect(within(modal).getByText('86%')).toBeInTheDocument();
  });
});
