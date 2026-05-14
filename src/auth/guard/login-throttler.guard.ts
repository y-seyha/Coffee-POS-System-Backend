import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {

    protected errorMessage =
        'Too many login attempts. Please try again later.';

    protected async getTracker(req: Record<string, any>): Promise<string> {
        return `${req.ip}-${req.body?.email}`;
    }
}