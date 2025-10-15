import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { CognitoJwtStrategy } from './strategies/cognito-jwt.strategy';
import { CognitoJwtAuthGuard } from './guards/cognito-jwt-auth.guard';
import { MailModule } from '../mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    MailModule,
    PassportModule.register({ defaultStrategy: 'cognito-jwt' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, CognitoJwtStrategy, CognitoJwtAuthGuard],
  exports: [AuthService, CognitoJwtAuthGuard],
})
export class AuthModule {}
