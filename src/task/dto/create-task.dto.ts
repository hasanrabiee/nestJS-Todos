import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @Type(() => Date) // Transform input to a Date instance
  @IsDate({ message: 'dueDate must be a valid date' }) // Validate that it's a Date instance
  dueDate: Date;

  @IsBoolean()
  @IsOptional()
  completed: boolean;
}
