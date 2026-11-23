/** Display-only helpers; never alter stored ledger timestamps or identities. */
export function relativeTime(timestamp: string, now: number, seconds = false): string {
    const written = Date.parse(timestamp);
    if (!Number.isFinite(written)) return 'Unknown time';
    const delta = now - written;
    const minutes = Math.floor(Math.abs(delta) / 60000);
    if (!minutes) {
        const count = Math.floor(Math.abs(delta) / 1000);
        if (seconds && count) return delta >= 0 ? `${count} sec ago` : `in ${count} sec`;
        return delta >= 0 ? 'just now' : 'in under 1 min';
    }
    const count = minutes < 60 ? minutes : minutes < 1440 ? Math.floor(minutes / 60) : Math.floor(minutes / 1440);
    const unit = minutes < 60 ? 'min' : minutes < 1440 ? 'hr' : count === 1 ? 'day' : 'days';
    return delta >= 0 ? `${count} ${unit} ago` : `in ${count} ${unit}`;
}
export function agentColor(id: string): string {
    const palette = ['#6742af', '#176d88', '#a34b21', '#426b25', '#aa3766', '#375bb0'];
    let hash = 0;
    for (const character of id) hash = (Math.imul(hash, 31) + character.codePointAt(0)!) >>> 0;
    return palette[hash % palette.length];
}

export function staleLimitLabel(milliseconds: number): string {
    if (milliseconds % 3600000 === 0) return `${milliseconds / 3600000} hr`;
    if (milliseconds % 60000 === 0) return `${milliseconds / 60000} min`;
    return `${milliseconds / 1000} sec`;
}
