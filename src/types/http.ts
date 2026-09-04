export interface Result<T> {
  code: "OK";
  message: string;
  data: T;
}

export interface PageResult<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
}

export interface FieldErrorDetail {
  field: string;
  message: string;
}

export interface ErrorResult {
  code: string;
  message: string;
  fieldErrors: FieldErrorDetail[];
}
