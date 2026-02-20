import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { FirebaseService } from '../firebase/firebase.service';
import { MailService } from '../mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private firebaseService: FirebaseService,
    private mailService: MailService,
  ) {}

  /**
   * Synchronise ou crée un utilisateur local à partir de son token Firebase
   */
  async validateFirebaseUser(token: string) {
    try {
      const decodedToken = await this.firebaseService.verifyIdToken(token);
      const { uid, email, name, picture } = decodedToken;

      let user = await this.userRepository.findOne({
        where: { cognito_sub: uid }, // On réutilise ce champ pour le UID Firebase pour ne pas casser la DB
      });

      if (!user) {
        user = this.userRepository.create({
          cognito_sub: uid, // UID Firebase
          email: email,
          name: name || email?.split('@')[0],
          avatar_url: picture,
        });
        await this.userRepository.save(user);
        this.logger.log(`✨ Nouvel utilisateur créé en base : ${user.email}`);
        
        // Email de bienvenue
        this.mailService.sendWelcomeEmail(user);
      } else {
        // Mise à jour si nécessaire
        user.last_login = new Date();
        await this.userRepository.save(user);
      }

      return user;
    } catch (error) {
      this.logger.error(`Erreur validation Firebase : ${error.message}`);
      throw new UnauthorizedException('Token invalide ou utilisateur introuvable');
    }
  }

  /**
   * Note : Les fonctions signUp, signIn, changePassword, etc. 
   * sont maintenant gérées directement par le Frontend via le SDK Firebase.
   * Le backend ne sert plus qu'à VALIDER le token et synchroniser les infos.
   */
}
