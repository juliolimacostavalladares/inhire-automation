import { IPaginatedResult } from '../../domain/dtos';

export interface IApiResponse<T> {
  data: T;
  meta?: unknown;
}

export class HttpResponseAdapter {
  static ok<T>(data: T): IApiResponse<T> {
    return { data };
  }

  static paginated<T>(result: IPaginatedResult<T>): IPaginatedResult<T> {
    return result;
  }
}
