import { test, expect } from '@playwright/test';
import { relativeTime, agentColor, staleLimitLabel } from '../../../agents/infra/lib/common/graph-ledger-display.js';

test('relative ages keep future/unknown distinct and identity colors stable', () => {
    const written = '2026-11-23T00:00:00.000Z';
    const epoch = Date.parse(written);
    expect(relativeTime(written, epoch + 60000)).toBe('1 min ago');
    expect(relativeTime(written, epoch + 120000)).toBe('2 min ago');
    expect(relativeTime(written, epoch + 3600000)).toBe('1 hr ago');
    expect(relativeTime(written, epoch - 60000)).toBe('in 1 min');
    expect(relativeTime(written, epoch + 1200, true)).toBe('1 sec ago');
    expect(staleLimitLabel(1000)).toBe('1 sec');
    expect(staleLimitLabel(300000)).toBe('5 min');
    expect(relativeTime('unknown', epoch)).toBe('Unknown time');
    expect(agentColor('worker:one')).toBe(agentColor('worker:one'));
    expect(agentColor('worker:one')).toMatch(/^#[0-9a-f]{6}$/);
});
