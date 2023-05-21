import { OmitType } from '@nestjs/mapped-types';

export class Response<T> {
  success: boolean;
  message: string;
  data: T;
}

export class ResponseWithNoData extends OmitType(Response<null>, [
  'data',
] as const) {
  override success: boolean;
  override message: string;
}

export class ValidationError {
  statusCode: number;
  message: string[];
  error: string;
}
