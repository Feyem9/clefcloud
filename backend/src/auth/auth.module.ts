import { Module, Global, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { MailModule } from '../mail.module';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => UsersModule),
    FirebaseModule,
    MailModule,
  ],
  providers: [
    AuthService,
    FirebaseAuthGuard,
  ],
  controllers: [AuthController],
  exports: [AuthService, FirebaseAuthGuard],
})
export class AuthModule {}
