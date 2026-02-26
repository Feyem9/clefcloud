import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { User } from '../../users/entities/user.entity';

interface FirebasePayload {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  [key: string]: unknown; // Pour les autres champs optionnels de Firebase
}

@Injectable()
export class FirebaseAuthStrategy extends PassportStrategy(Strategy, 'firebase-auth') {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'UNUSED', // La validation se fait via FirebaseService, pas via cette clé
    });
  }

  /**
   * Passport appelle validate APRES avoir extrait le JWT.
   * Mais pour Firebase, nous devons appeler manuellement firebase-admin.
   * Nous utilisons donc la requête brute pour récupérer le token original.
   */
  async validate(payload: FirebasePayload, done: (error: Error | null, user: User | boolean | undefined) => void) {
    // Cette méthode est appelée par Passport, mais pour Firebase,
    // nous allons passer par un Guard plus spécifique ou intercepter le token.
    return payload; // Simplifié, le travail lourd sera dans le Guard
  }
}
