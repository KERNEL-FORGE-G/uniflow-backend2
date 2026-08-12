// src/common/guards/dev-only.guard.ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class DevOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        "Cet outil n'est disponible qu'en environnement de développement/test",
      );
    }
    return true;
  }
}