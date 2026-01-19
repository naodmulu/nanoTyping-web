// testModes.ts
import { TestConfig, TestMode } from './types';

export const DEFAULT_WORD_COUNT = 25;
export const WORD_COUNT_OPTIONS = [10, 25, 50, 100] as const;

export const DEFAULT_CONFIG: TestConfig = {
    mode: 'words',
    wordCount: DEFAULT_WORD_COUNT,
    punctuation: false,
    numbers: false,
};

export function createTestConfig(
    mode: TestMode,
    options?: Partial<TestConfig>
): TestConfig {
    return {
        ...DEFAULT_CONFIG,
        mode,
        ...options,
    };
}
