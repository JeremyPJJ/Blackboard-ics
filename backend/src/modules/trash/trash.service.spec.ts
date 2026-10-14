import { ConflictException, NotFoundException } from '@nestjs/common';
import { TrashService } from './trash.service';
import { TrashType } from './schemas/trash.schema';

/**
 * Pruebas de la lógica de restauración de la papelera
 * (Spec: Trash — restore clears soft-delete fields on the ORIGINAL collection;
 * hard-deleted original → 409 + error state; permanent delete removes both).
 *
 * El servicio se prueba con un mock de `trashModel` (mongoose) que expone
 * `db.collection(...)` para operar sobre la colección original.
 */
describe('TrashService', () => {
  const originalId = '64f0a1b2c3d4e5f6a7b8c9d0';

  function buildTrashEntry(overrides: Record<string, unknown> = {}) {
    return {
      _id: 'trash-id-1',
      type: TrashType.USER,
      originalCollection: 'users',
      document: { _id: originalId, names: 'Ana', deletedAt: new Date() },
      deletedBy: 'admin-id',
      deletedAt: new Date(),
      restoreUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isRestored: false,
      restoreError: undefined,
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      }),
      ...overrides,
    } as any;
  }

  function setupService(options?: {
    originalExists?: boolean;
    trashEntry?: any;
  }) {
    const trashEntry =
      options?.trashEntry ?? buildTrashEntry();

    const collectionMock = {
      findOne: jest.fn().mockResolvedValue(
        options?.originalExists === false ? null : { _id: originalId },
      ),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    };

    const trashModel = {
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(trashEntry),
      }),
      deleteOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      }),
      db: {
        collection: jest.fn().mockReturnValue(collectionMock),
      },
    } as any;

    const service = new TrashService(trashModel);
    return { service, trashEntry, collectionMock, trashModel };
  }

  describe('restore', () => {
    it('limpia deletedAt/deletedBy/restoreUntil en la colección ORIGINAL y marca restaurado', async () => {
      const { service, collectionMock, trashEntry } = setupService({
        originalExists: true,
      });

      const result = await service.restore('trash-id-1', 'admin-id');

      expect(collectionMock.findOne).toHaveBeenCalledWith({
        _id: originalId,
      });
      expect(collectionMock.updateOne).toHaveBeenCalledWith(
        { _id: originalId },
        {
          $unset: { deletedAt: 1, deletedBy: 1, restoreUntil: 1 },
        },
      );
      expect(trashEntry.isRestored).toBe(true);
      expect(trashEntry.restoredBy).toBe('admin-id');
      expect(trashEntry.restoreError).toBeUndefined();
      expect(result.isRestored).toBe(true);
    });

    it('restaura un curso además setando status a activo', async () => {
      const { service, collectionMock, trashEntry } = setupService({
        originalExists: true,
        trashEntry: buildTrashEntry({
          type: TrashType.COURSE,
          originalCollection: 'courses',
        }),
      });

      await service.restore('trash-id-1', 'admin-id');

      expect(collectionMock.updateOne).toHaveBeenCalledWith(
        { _id: originalId },
        {
          $unset: { deletedAt: 1, deletedBy: 1, restoreUntil: 1 },
          $set: { status: 'activo' },
        },
      );
      expect(trashEntry.isRestored).toBe(true);
    });

    it('si el original fue hard-deleted → 409, registra restoreError y NO marca restaurado', async () => {
      const { service, trashEntry } = setupService({
        originalExists: false,
      });

      await expect(service.restore('trash-id-1', 'admin-id')).rejects.toThrow(
        ConflictException,
      );

      expect(trashEntry.isRestored).toBe(false);
      expect(trashEntry.restoreError).toContain('eliminado de forma permanente');
      expect(trashEntry.restoreUntil).toBeDefined();
    });

    it('lanza NotFoundException si el período de restauración expiró', async () => {
      const { service } = setupService({
        originalExists: true,
        trashEntry: buildTrashEntry({
          restoreUntil: new Date(Date.now() - 1000),
        }),
      });

      await expect(service.restore('trash-id-1', 'admin-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('permanentlyDelete', () => {
    it('hard-deletea el documento original (si existe) y elimina la entrada de la papelera', async () => {
      const { service, collectionMock, trashModel, trashEntry } = setupService({
        originalExists: true,
      });

      await service.permanentlyDelete('trash-id-1');

      expect(collectionMock.deleteOne).toHaveBeenCalledWith({ _id: originalId });
      expect(trashModel.deleteOne).toHaveBeenCalledWith({ _id: 'trash-id-1' });
      expect(trashEntry.permanentlyDeletedAt).toBeInstanceOf(Date);
    });
  });
});