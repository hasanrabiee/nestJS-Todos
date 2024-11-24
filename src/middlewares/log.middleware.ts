import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Injectable()
export class LogMiddleware implements NestMiddleware {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const userAgent = req.get('user-agent') || '';
    const ip = req.ip;

    const startTime = Date.now();

    // Listen for the 'finish' event to log after the response is completed
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length') || '0';
      const responseTime = Date.now() - startTime;

      // Log the request and response details using Winston
      this.logger.info({
        message: 'Request completed',
        method,
        url: originalUrl,
        statusCode,
        contentLength,
        responseTime,
        userAgent,
        ip,
      });
    });

    // Continue to the next middleware
    next();
  }
}
