import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { TrashService } from '../trash/trash.service';
import { TrashType } from '../trash/schemas/trash.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly trashService: TrashService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    // Verificar si el email o DNI ya existe
    const existingUser = await this.userModel.findOne({
      $or: [
        { institutionalEmail: createUserDto.institutionalEmail },
        { dni: createUserDto.dni },
      ],
    });

    if (existingUser) {
      throw new ConflictException('El email o DNI ya está registrado');
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    return user.save();
  }

  async findAll(filters?: { role?: string; status?: string; tags?: string[]; search?: string }): Promise<UserDocument[]> {
    const query: any = {};

    if (filters?.role) {
      query.role = filters.role;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    if (filters?.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { dni: searchRegex },
        { names: searchRegex },
        { lastNames: searchRegex },
        { institutionalEmail: searchRegex },
      ];
    }

    // Excluir usuarios eliminados
    query.deletedAt = { $exists: false };

    return this.userModel.find(query).exec();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user || user.deletedAt) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ 
      institutionalEmail: email,
      deletedAt: { $exists: false },
    }).exec();
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    // Si se está actualizando la contraseña, hashearla
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.userModel.findByIdAndUpdate(
      id,
      updateUserDto,
      { new: true },
    ).exec();

    if (!user || user.deletedAt) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async remove(id: string, deletedBy: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user || user.deletedAt) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Snapshot completo en la papelera antes del soft-delete
    // (Spec: delete user → Trash entry of type USER with full document snapshot,
    // deletedBy and restoreUntil of 30 days).
    const restoreUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.trashService.moveToTrash(
      TrashType.USER,
      this.userModel.collection.collectionName,
      user.toObject(),
      deletedBy,
      'Usuario eliminado',
    );

    // Soft delete
    user.deletedAt = new Date();
    user.deletedBy = deletedBy as any;
    user.restoreUntil = restoreUntil;

    return user.save();
  }

  async restore(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user || !user.deletedAt) {
      throw new NotFoundException('Usuario no está en la papelera');
    }

    if (user.restoreUntil < new Date()) {
      throw new NotFoundException('El período de restauración ha expirado');
    }

    // Alinear con CoursesService.restore: $unset en lugar de undefined inline
    // (design decision: users.service pasa de restore inline a $unset).
    await this.userModel.updateOne(
      { _id: id },
      { $unset: { deletedAt: 1, deletedBy: 1, restoreUntil: 1 } },
    ).exec();

    return this.userModel.findById(id).exec() as Promise<UserDocument>;
  }

  async changePassword(userId: string, newPassword: string): Promise<UserDocument> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.userModel.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true },
    ).exec();
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, {
      lastLogin: new Date(),
    }).exec();
  }
}
