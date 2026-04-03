import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  Post,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { R2Service } from '../r2/r2.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly r2Service: R2Service,
  ) {}

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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour le profil utilisateur' })
  @ApiResponse({ status: 200, description: 'Profil mis à jour' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { name?: string; title?: string; avatar_url?: string },
  ) {
    return this.usersService.update(id, data);
  }

  @Post('avatar')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Uploader un avatar' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadAvatar(@Req() req, @UploadedFile() file: Express.Multer.File) {
    const userId = req.user.id;
    const cleanPath = `avatars/${userId}-${Date.now()}-${file.originalname}`;
    const result = await this.r2Service.uploadFile(userId, file, cleanPath);
    
    // Mettre à jour l'utilisateur avec la nouvelle URL
    return this.usersService.update(userId, { avatar_url: result.downloadUrl });
  }
}
