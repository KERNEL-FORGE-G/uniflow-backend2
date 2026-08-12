import {
  IsString,
  IsIn,
  IsObject,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const SYNCABLE_ENTITIES = [
  'student',
  'teacher',
  'teachingUnit',
  'enrollment',
] as const;
export type SyncableEntity = (typeof SYNCABLE_ENTITIES)[number];

export class SyncOperationDto {
  @IsString()
  @IsIn(SYNCABLE_ENTITIES)
  entity!: SyncableEntity;

  @IsString()
  @IsIn(['create', 'update', 'delete'])
  operation!: 'create' | 'update' | 'delete';

  @IsString()
  recordId!: string;

  @IsObject()
  data!: Record<string, unknown>;

  @IsDateString()
  updatedAt!: string;
}

export class SyncPushDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncOperationDto)
  operations!: SyncOperationDto[];
}
