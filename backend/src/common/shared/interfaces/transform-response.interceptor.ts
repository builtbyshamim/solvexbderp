import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
/**
 * TransformResponseInterceptor
 *
 * This NestJS interceptor is used to standardize the shape of all HTTP responses
 * sent from the server. Instead of returning raw data, every response is wrapped
 * in a consistent JSON structure that includes metadata about the request.
 *
 * The interceptor works by:
 * 1. Extracting the HTTP context from the ExecutionContext.
 * 2. Getting the request and response objects from the context.
 * 3. Capturing the HTTP status code of the response.
 * 4. Intercepting the outgoing data using RxJS `map` operator.
 * 5. Wrapping the original data in a structured object with the following fields:
 *    - success: always true (indicating successful operation)
 *    - statusCode: HTTP status code of the response
 *    - timestamp: current date and time in ISO format
 *    - path: the URL of the request
 *    - data: the original response data
 *
 * This ensures that all API responses are consistent and easy to handle on the client side.
 *
 * @template T - The type of the original response data
 */
@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, any>
{
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Type assertion for safety
    const ctx: HttpArgumentsHost = context.switchToHttp();

    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode,
        timestamp: new Date().toISOString(),
        path: request.url,
        data,
      })),
    );
  }
}
