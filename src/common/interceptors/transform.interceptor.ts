import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
}

interface PaginatedData {
  items: unknown;
  [key: string]: unknown;
}

function hasItems(data: unknown): data is PaginatedData {
  return data !== null && typeof data === 'object' && 'items' in data;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data: unknown): Response<T> => {
        if (hasItems(data)) {
          const { items, ...meta } = data;
          return { success: true, data: items as T, meta };
        }
        return { success: true, data: data as T };
      }),
    );
  }
}
