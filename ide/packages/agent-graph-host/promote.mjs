import { rename, rm } from 'node:fs/promises';

/** Same-filesystem directory replacement. Keep the previous package until promotion succeeds. */
export async function promotePackage(candidate, destination, backup, move = rename) {
    let saved = false;
    try {
        await move(destination, backup);
        saved = true;
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
    try {
        await move(candidate, destination);
    } catch (error) {
        if (saved) {
            try { await move(backup, destination); }
            catch (rollbackError) {
                throw new AggregateError([error, rollbackError], `Package promotion and rollback failed; previous exports retained at ${backup}`);
            }
        }
        throw error;
    }
    if (saved) await rm(backup, { recursive: true, force: true });
}
