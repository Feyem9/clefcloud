import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer le profil d\'un utilisateur' })
  @ApiResponse({ status: 200, description: 'Profil utilisateur' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Get(':id/partitions')
  @ApiOperation({ summary: 'Récupérer les partitions d\'un utilisateur' })
  @ApiResponse({ status: 200, description: 'Liste des partitions' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async findPartitions(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit', ParseIntPipe) limit: number = 50,
    @Query('offset', ParseIntPipe) offset: number = 0,
  ) {
    return this.usersService.findPartitions(id, limit, offset);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour le profil utilisateur' })
  @ApiResponse({ status: 200, description: 'Profil mis à jour' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body('name') name: string,
  ) {
    return this.usersService.update(id, name);
  }
}
