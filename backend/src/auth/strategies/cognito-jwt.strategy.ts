import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CognitoJwtStrategy extends PassportStrategy(Strategy, 'cognito-jwt') {
  constructor(private configService: ConfigService) {
    const region = configService.get<string>('COGNITO_REGION');
    const userPoolId = configService.get<string>('COGNITO_USER_POOL_ID');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience: configService.get<string>('COGNITO_CLIENT_ID'),
      issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`,
      }),
    });
  }

  async validate(payload: any) {
    if (!payload) {
      throw new UnauthorizedException('Invalid token');
    }

    // Le payload contient les claims du JWT Cognito
    return {
      userId: payload.sub,
      username: payload['cognito:username'] || payload.username,
      email: payload.email,
      emailVerified: payload.email_verified,
      groups: payload['cognito:groups'] || [],
      tokenUse: payload.token_use,
    };
  }
}
