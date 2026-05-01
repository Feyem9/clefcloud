import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';

export class PayunitCallbackDto {
  @IsString()
  transaction_id: string;

  @IsString()
  payunit_transaction_id: string;

  @IsIn(['SUCCESS', 'FAILED'])
  status: 'SUCCESS' | 'FAILED';

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  message?: string;
}
