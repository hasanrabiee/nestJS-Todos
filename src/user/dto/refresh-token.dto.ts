import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'refresh token ',
    description: 'token will be expired so you have use this to login again',
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
