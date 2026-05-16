import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: (req) => req?.cookies?.['access_token'],
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'secret_key',
        });
    }

    async validate(payload: any) {
        // console.log(' JWT PAYLOAD:', payload);
        // console.log('STRATEGY SECRET:', process.env.JWT_SECRET || 'secret_key');

        return {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
        };
    }
}