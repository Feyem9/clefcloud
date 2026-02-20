import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';
import { FirebaseModule } from '../firebase/firebase.module';
import { MailModule } from '../mail.module';
import { FirebaseAuthStrategy } from './strategies/firebase-auth.strategy';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'firebase-auth' }),
    FirebaseModule,
    MailModule,
  ],
  providers: [
    AuthService,
    FirebaseAuthStrategy,
    FirebaseAuthGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService, FirebaseAuthGuard, PassportModule],
})
export class AuthModule {}
