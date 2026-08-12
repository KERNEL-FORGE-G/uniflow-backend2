// src/schedules/dto/generate-schedules.dto.ts
//
// Génère automatiquement des créneaux pour une liste de cours donnée.
// Approche volontairement simple (glouton) : on essaie les créneaux
// disponibles dans l'ordre, on place le premier qui ne crée pas de conflit.
// Le CDC (§4.7) mentionne un "auto-ajustement" plus sophistiqué (réassignation
// de salle, division de groupe) — hors de portée réaliste pour ce sprint,
// à documenter comme limitation connue plutôt que de faire semblant de le couvrir.

import { IsUUID, IsArray } from 'class-validator';

export class GenerateSchedulesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  courseIds!: string[];
}
