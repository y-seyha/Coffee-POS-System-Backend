import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => {
                    return req?.cookies?.access_token ?? null;
                },
            ]),
            secretOrKey: process.env.JWT_SECRET || 'secret_key',
        });
    }

    async validate(payload: any) {
        return {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
        };
    }
}