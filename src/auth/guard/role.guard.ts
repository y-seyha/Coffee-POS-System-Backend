import {CanActivate, ExecutionContext, ForbiddenException, Injectable} from "@nestjs/common";
import {Reflector} from "@nestjs/core";
import {Observable} from "rxjs";
import {ROLES_KEY} from "../decorator/roles.decorator";


@Injectable()
export class RoleGuard implements CanActivate{
    constructor(
        private reflector: Reflector,
    ) {
    }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        // No role restriction → allow access
        if(!requiredRoles || requiredRoles.length === 0)
            return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if(!user)
            throw new ForbiddenException('User is not authenticated');

        const hasRole = requiredRoles.includes(user.role);

        if (!hasRole)
            throw new ForbiddenException(
                `Access denied. Required roles: ${requiredRoles.join(', ')}`,
            );

        return true;
    }
}