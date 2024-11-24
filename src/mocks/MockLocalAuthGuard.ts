import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class MockLocalAuthGuard extends AuthGuard('local') {
  canActivate(context: ExecutionContext): boolean {
    return true; // Bypass the guard for testing
  }
}
