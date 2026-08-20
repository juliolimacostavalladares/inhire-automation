export interface IPaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface IPaginatedResult<T> {
  data: T[];
  meta: IPaginationMeta;
}
