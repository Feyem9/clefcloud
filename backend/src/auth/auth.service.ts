import { Injectable, Logger, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { FirebaseService } from '../firebase/firebase.service';
import { MailService } from '../mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
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
        where: { cognito_sub: uid },
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
   * Récupère les statistiques du profil utilisateur
   */
  async getProfileStats(user: User) {
    return this.usersService.getProfileStats(user);
  }

  /**
   * Met à jour le profil de l'utilisateur connecté
   */
  async updateProfile(user: User, name: string) {
    return this.usersService.update(user.id, name);
  }

  /**
   * Supprime le compte de l'utilisateur de la base de données
   */
  async deleteAccount(user: User) {
    return this.usersService.deleteUser(user.id);
  }

  /**
   * Note : Les fonctions signUp, signIn, changePassword, etc. 
   * sont maintenant gérées directement par le Frontend via le SDK Firebase.
   * Le backend ne sert plus qu'à VALIDER le token et synchroniser les infos.
   */
}
