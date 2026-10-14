import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Trash, TrashDocument, TrashType } from './schemas/trash.schema';

@Injectable()
export class TrashService {
  constructor(
    @InjectModel(Trash.name) private readonly trashModel: Model<TrashDocument>,
  ) {}

  async moveToTrash(
    type: TrashType,
    originalCollection: string,
    document: any,
    deletedBy: string,
    reason?: string,
  ): Promise<TrashDocument> {
    const restoreUntil = new Date();
    restoreUntil.setDate(restoreUntil.getDate() + 30); // 30 días

    const trash = new this.trashModel({
      type,
      originalCollection,
      document,
      deletedBy: deletedBy as any,
      deletedAt: new Date(),
      restoreUntil,
      reason,
      isRestored: false,
    });

    return trash.save();
  }

  async findAll(filters?: { type?: TrashType }): Promise<TrashDocument[]> {
    const query: any = { isRestored: { $ne: true } };
    if (filters?.type) query.type = filters.type;
    return this.trashModel.find(query).sort({ deletedAt: -1 }).exec();
  }

  async findById(id: string): Promise<TrashDocument> {
    const trash = await this.trashModel.findById(id).exec();
    if (!trash || trash.isRestored) {
      throw new NotFoundException('Elemento no encontrado en la papelera');
    }
    return trash;
  }

  async restore(id: string, restoredBy: string): Promise<TrashDocument> {
    const trash = await this.findById(id);

    if (trash.restoreUntil < new Date()) {
      throw new NotFoundException('El período de restauración ha expirado');
    }

    const originalId = trash.document?._id;
    const collection = this.trashModel.db.collection(trash.originalCollection);

    // Buscar el documento original en su colección (por id). Si fue eliminado
    // de forma permanente (hard-delete) o no existe, no se puede restaurar.
    const original = originalId
      ? await collection.findOne({ _id: originalId })
      : null;

    if (!original) {
      // Marcar el error en la entrada y NO restaurarla (Spec: hard-deleted original → 409).
      trash.restoreError =
        'El documento original fue eliminado de forma permanente y no puede restaurarse';
      await trash.save();
      throw new ConflictException('El documento original ya no existe en su colección');
    }

    // Limpiar los campos de soft-delete en la colección ORIGINAL
    // (Spec: restore clears deletedAt/deletedBy/restoreUntil).
    const unset: Record<string, number> = {
      deletedAt: 1,
      deletedBy: 1,
      restoreUntil: 1,
    };
    const set: Record<string, unknown> = {};
    if (trash.type === TrashType.COURSE) {
      set.status = 'activo';
    }

    await collection.updateOne(
      { _id: originalId },
      { $unset: unset, ...(Object.keys(set).length ? { $set: set } : {}) },
    );

    trash.isRestored = true;
    trash.restoredAt = new Date();
    trash.restoredBy = restoredBy as any;
    trash.restoreError = undefined;

    return trash.save();
  }

  async permanentlyDelete(id: string): Promise<void> {
    const trash = await this.findById(id);

    // Si el documento original todavía existe, hard-deletearlo
    // (Spec: permanent delete removes trash entry AND hard-deletes original if present).
    const originalId = trash.document?._id;
    if (originalId) {
      await this.trashModel.db.collection(trash.originalCollection).deleteOne({ _id: originalId });
    }

    trash.permanentlyDeletedAt = new Date();
    await trash.save();
    await this.trashModel.deleteOne({ _id: id }).exec();
  }

  async cleanExpiredTrash(): Promise<number> {
    const result = await this.trashModel.deleteMany({
      restoreUntil: { $lt: new Date() },
      isRestored: { $ne: true },
    }).exec();

    return result.deletedCount;
  }
}
