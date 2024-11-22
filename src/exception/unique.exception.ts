import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Response } from 'express';

@Catch(QueryFailedError)
export class UniqueConstraintExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception.message.includes('duplicate key value violates unique constraint')) {
      // Extract the constraint name from the error message, if needed
      const constraintName = exception.message.match(/"([^"]+)"/)?.[1] ?? 'Unique constraint violation';
      
      // Send a custom error response
      response.status(400).json({
        statusCode: 400,
        message: `Duplicate value for ${constraintName}, please use a unique value.`,
        error: 'Bad Request',
      });
    } else {
      // If the error is not related to a unique constraint, pass it through as a generic error
      response.status(500).json({
        statusCode: 500,
        message: 'Internal Server Error',
        error: 'Internal Server Error',
      });
    }
  }
}
