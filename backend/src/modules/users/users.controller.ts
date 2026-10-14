import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permission } from '../../common/decorators/permission.decorator';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Permission('usuarios.crear')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('tags') tags?: string,
    @Query('search') search?: string,
  ) {
    const tagsArray = tags ? tags.split(',') : undefined;
    return this.usersService.findAll({ role, status, tags: tagsArray, search });
  }

  @Get('profile')
  getProfile(@Request() req) {
    return this.usersService.findById(req.user._id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @Permission('usuarios.editar')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permission('usuarios.eliminar')
  remove(@Param('id') id: string, @Request() req) {
    return this.usersService.remove(id, req.user._id);
  }

  @Post(':id/restore')
  @UseGuards(PermissionsGuard)
  @Permission('usuarios.editar')
  restore(@Param('id') id: string) {
    return this.usersService.restore(id);
  }

  @Post(':id/change-password')
  @UseGuards(PermissionsGuard)
  @Permission('usuarios.editar')
  changePassword(@Param('id') id: string, @Body('newPassword') newPassword: string) {
    return this.usersService.changePassword(id, newPassword);
  }
}
