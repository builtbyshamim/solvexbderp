// ==========================================
// src/common/filters/http-exception.filter.ts
// ==========================================
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string | string[];
    let error: string;

    if (exception instanceof HttpException) {
      // HTTP Exception handling
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = 'Error';
      } else {
        const res = exceptionResponse as any;
        message = res.message || exception.message;
        error = res.error || exception.name;
      }
    } else if (exception instanceof Error) {
      // Database and other errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      error = exception.name;

      // Database specific error handling
      if (exception.name === 'QueryFailedError') {
        message = 'Database query failed';
        const dbError = exception as any;
        
        // MySQL/PostgreSQL error codes
        // Duplicate entry error
        if (dbError.code === 'ER_DUP_ENTRY' || dbError.code === '23505') {
          status = HttpStatus.CONFLICT;
          message = 'Duplicate entry found';
        }
        // Foreign key constraint error
        else if (dbError.code === 'ER_NO_REFERENCED_ROW_2' || dbError.code === '23503') {
          status = HttpStatus.BAD_REQUEST;
          message = 'Referenced record not found';
        }
        // Not null constraint
        else if (dbError.code === 'ER_BAD_NULL_ERROR' || dbError.code === '23502') {
          status = HttpStatus.BAD_REQUEST;
          message = 'Required field is missing';
        }
      } 
      // TypeORM EntityNotFoundError
      else if (exception.name === 'EntityNotFoundError') {
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
      }
      // TypeORM EntityNotFound (alternative)
      else if (exception.message.includes('Could not find')) {
        status = HttpStatus.NOT_FOUND;
        message = exception.message;
      } else {
        message = exception.message || 'Internal server error';
      }
    } else {
      // Unknown errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'InternalServerError';
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: error,
      message: message,
    });
  }
}