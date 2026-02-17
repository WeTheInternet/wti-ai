import { injectable, inject } from '@theia/core/shared/inversify';
import { MessageService } from '@theia/core/lib/common/message-service';
import { FileSystemError } from '@theia/filesystem/lib/common/filesystem';
import { WorkspaceDeleteHandler } from '@theia/workspace/lib/browser/workspace-delete-handler';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import URI from '@theia/core/lib/common/uri';

/**
 * WorkspaceDeleteHandler that falls back to permanent delete if "move to trash" fails
 * for mounts/environments that don't support the Freedesktop trash semantics.
 */
@injectable()
export class TrashFallbackWorkspaceDeleteHandler extends WorkspaceDeleteHandler {

    @inject(MessageService)
    protected readonly messageService: MessageService;

    @inject(FileService)
    protected readonly fileService: FileService;

    private warnedOnce = false;

    protected override async moveFileToTrash(uri: URI): Promise<void> {
        try {
            await super.moveFileToTrash(uri);
        } catch (err) {
            if (this.shouldFallbackToPermanentDelete(err)) {
                // Optional: warn once (but do not spam logs)
                if (!this.warnedOnce) {
                    this.warnedOnce = true;
                    this.messageService.warn(
                        'Move to Trash is not supported for this location. Files will be permanently deleted.'
                    );
                }

                // Fallback to permanent delete (no trash).
                // FileService.delete accepts { useTrash?: boolean } in Theia 1.68.x
                await this.fileService.delete(uri, { useTrash: false });
                return;
            }
            throw err;
        }
    }

    protected shouldFallbackToPermanentDelete(err: unknown): boolean {
        // Theia wraps backend fs errors in FileSystemError.
        // We treat "trash unsupported" style failures as non-fatal.
        const message = (err instanceof Error ? err.message : String(err)).toLowerCase();

        // Fast-path: common mkdir /.Trash-UID failures like in your log.
        if (message.includes('.trash-') && (message.includes('enoent') || message.includes('eacces') || message.includes('eperm'))) {
            return true;
        }

        // Theia FileSystemError codes (not always present, but useful when they are).
        if (FileSystemError.is(err)) {
            // Some environments don’t allow creating trash dirs or cross-device moves.
            // Treat those as “trash unsupported”.
            return true;
        }

        // Cross-device rename/move often fails with EXDEV; trash move is basically a move.
        if (message.includes('exdev')) {
            return true;
        }

        // A few other common “not supported” patterns.
        if (message.includes('enotsup') || message.includes('not supported')) {
            return true;
        }

        return false;
    }
}
