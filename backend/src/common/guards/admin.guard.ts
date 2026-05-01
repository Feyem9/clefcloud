import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Guard qui vérifie que l'utilisateur connecté est administrateur.
 * Utiliser avec @UseGuards(AdminGuard) sur les routes ou contrôleurs admin.
 * Le FirebaseAuthGuard global doit avoir été exécuté avant (req.user doit exister).
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.is_admin) {
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }

    return true;
  }
}
