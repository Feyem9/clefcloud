import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from '../auth.service';

interface FirebasePayload {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  [key: string]: unknown;
}

@Injectable()
export class FirebaseAuthStrategy extends PassportStrategy(Strategy, 'firebase-auth') {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'UNUSED', // Validation via FirebaseService dans le guard
    });
  }

  async validate(payload: FirebasePayload) {
    return payload;
  }
}
