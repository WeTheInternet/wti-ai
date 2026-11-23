import * as React from '@theia/core/shared/react';
import { relativeTime } from '../common/graph-ledger-display.js';

export function LedgerRelativeTime({ timestamp, now, label, testId, seconds }: {
    timestamp: string; now: number; label: string; testId?: string; seconds?: boolean;
}): React.ReactElement {
    const tooltipId = React.useId();
    const [open, setOpen] = React.useState(false);
    return React.createElement('span', {
        className: 'wti-ledger-time',
        onMouseEnter: () => setOpen(true),
        onMouseLeave: (event: React.MouseEvent<HTMLSpanElement>) => {
            if (!event.currentTarget.contains(document.activeElement)) setOpen(false);
        },
        onBlur: (event: React.FocusEvent<HTMLSpanElement>) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
        }
    }, React.createElement('time', {
        dateTime: timestamp, tabIndex: 0, 'aria-describedby': tooltipId,
        'aria-label': `${label} ${relativeTime(timestamp, now, seconds)}`, 'data-testid': testId,
        onFocus: () => setOpen(true),
        onKeyDown: (event: React.KeyboardEvent<HTMLTimeElement>) => {
            if (event.key === 'Escape') { setOpen(false); event.stopPropagation(); }
        }
    }, relativeTime(timestamp, now, seconds)),
    React.createElement('span', { id: tooltipId, role: 'tooltip', hidden: !open, className: 'wti-ledger-time-exact' }, `${timestamp} (UTC)`));
}
