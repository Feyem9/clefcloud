import { TransactionStatus } from "../../common/enums/transaction.enum";

export interface PayunitCallbackDto {
  transaction_id: string;
  payunit_transaction_id: string;
  status: 'SUCCESS' | 'FAILED'; // Statut brut envoyé par PayUnit
  amount: number;
  message?: string;
}
