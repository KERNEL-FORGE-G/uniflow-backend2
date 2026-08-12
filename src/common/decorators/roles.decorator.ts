// src/common/decorators/roles.decorator.ts
//
// Permet d'annoter un endpoint avec les rôles autorisés, ex :
//   @Roles('Admin', 'Secretariat')
//   @Get('students')
// Le RolesGuard (ci-dessous) lira cette métadonnée pour valider l'accès.
// Rôles définis au §5 du CDC : SuperAdmin, Admin, Direction, Secretariat,
// Enseignant, Delegue, Etudiant, Bibliothecaire, Comptable.

import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
