import { ApiProperty } from '@nestjs/swagger';

export class TaskResponseDto {
  @ApiProperty({ example: 1, description: 'The unique identifier of the user' })
  id: string;

  @ApiProperty({ example: 'title', description: 'The title for task' })
  title: string;

  @ApiProperty({
    example: 'description',
    description: 'this is the description for the task',
  })
  description: string;

  @ApiProperty({
    example: '2023-12-01T12:34:56Z',
    description: 'This is the due date',
  })
  dueDate: string;
}
