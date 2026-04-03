import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
  NotFoundException,
  Put,
} from '@nestjs/common';
import { Response } from 'express';
import { Readable } from 'stream';
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
    
    // Assainissement du nom de fichier : minuscules, pas d'espaces, pas de caractères spéciaux
    const extension = file.originalname.split('.').pop();
    const sanitizedName = file.originalname
      .split('.')[0]
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^a-z0-p0-9]/g, '-')   // Remplace tout ce qui n'est pas alphanumérique par des tirets
      .replace(/-+/g, '-')             // Évite les tirets multiples
      .replace(/^-|-$/g, '');          // Supprime les tirets au début ou à la fin

    const fileName = `${userId}-${Date.now()}-${sanitizedName}.${extension}`;
    const cleanPath = `avatars/${fileName}`;
    
    await this.r2Service.uploadFile(userId, file, cleanPath);
    
    // Au lieu de l'URL directe R2 qui a des problèmes CORS/401, on utilise notre PROXY local
    const proxyUrl = `/api/users/avatar/${fileName}`;
    
    return this.usersService.update(userId, { avatar_url: proxyUrl });
  }

  @Get('avatar/:filename')
  @ApiOperation({ summary: 'Afficher l\'avatar via proxy (fix CORS/401)' })
  async getAvatar(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const key = `avatars/${filename}`;
      const fileData = await this.r2Service.getFile(key);
      
      res.setHeader('Content-Type', fileData.ContentType || 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache 1 an
      
      const body = fileData.Body;
      if (body instanceof Readable) {
        body.pipe(res);
      } else if (body instanceof Uint8Array || Buffer.isBuffer(body)) {
        res.send(Buffer.from(body));
      } else if (typeof body === 'string') {
        res.send(body);
      } else {
        // Fallback pour les environnements bizarres
        const stream = body as any;
        if (stream.transformToByteArray) {
            res.send(Buffer.from(await stream.transformToByteArray()));
        } else {
            res.status(500).send('Format de body R2 non supporté');
        }
      }
    } catch (error) {
      console.error(`Erreur proxy avatar: ${error.message}`);
      res.status(404).send('Avatar non trouvé');
    }
  }
}
