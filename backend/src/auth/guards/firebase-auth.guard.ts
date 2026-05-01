import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';

// Compteur en mémoire pour détecter les IPs suspectes
const failureTracker = new Map<string, { count: number; lastSeen: number }>();
const SUSPICIOUS_THRESHOLD = 10; // tentatives échouées
const TRACKER_TTL_MS = 60_000; // fenêtre de 1 minute

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger('FirebaseAuthGuard');

  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.trackFailure(ip, 'missing_token');
      throw new UnauthorizedException('Token manquant ou format invalide');
    }

    const token = authHeader.split(' ')[1];

    try {
      const user = await this.authService.validateFirebaseUser(token);
      request.user = user;
      // Réinitialiser le compteur en cas de succès
      failureTracker.delete(ip);
      return true;
    } catch (error) {
      const reason = this.classifyError(error.message);
      this.trackFailure(ip, reason);
      this.logger.warn(`Auth failed [${reason}] — IP: ${ip} — token: ${token.substring(0, 10)}...`);
      throw new UnauthorizedException('Session expirée ou invalide');
    }
  }

  private classifyError(message: string): string {
    if (message?.includes('expired')) return 'token_expired';
    if (message?.includes('invalid')) return 'token_invalid';
    if (message?.includes('revoked')) return 'token_revoked';
    return 'auth_error';
  }

  private trackFailure(ip: string, reason: string): void {
    const now = Date.now();
    const entry = failureTracker.get(ip);

    if (!entry || now - entry.lastSeen > TRACKER_TTL_MS) {
      failureTracker.set(ip, { count: 1, lastSeen: now });
      return;
    }

    entry.count += 1;
    entry.lastSeen = now;

    if (entry.count >= SUSPICIOUS_THRESHOLD) {
      this.logger.error(
        `🚨 IP SUSPECTE: ${ip} — ${entry.count} échecs d'auth en moins d'1 minute (dernière raison: ${reason})`,
      );
    }
  }
}
