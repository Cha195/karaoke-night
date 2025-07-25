export interface ServerResponseType<T> {
  success: boolean;
  status: number;
  message: string;
  data?: T;
  error?: any;
}
