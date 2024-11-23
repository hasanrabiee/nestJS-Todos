import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'The email of the user',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Aa@123456',
    description: 'The password of the user',
  })
  @IsStrongPassword()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsString()
  refreshToken: string;
}
