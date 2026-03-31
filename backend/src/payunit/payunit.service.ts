import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PayunitService {
  private readonly logger = new Logger(PayunitService.name);
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = 'https://gateway.payunit.net/api/gateway';
  }

  private getHeaders() {
    const apiKey = this.configService.get<string>('PAYUNIT_API_KEY');
    const user = this.configService.get<string>('PAYUNIT_USER');
    const password = this.configService.get<string>('PAYUNIT_PASSWORD');
    const mode = this.configService.get<string>('PAYUNIT_MODE', 'sandbox');

    const auth = Buffer.from(`${user}:${password}`).toString('base64');

    return {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'Authorization': `Basic ${auth}`,
      'mode': mode,
    };
  }

  /**
   * Initialise un paiement via PayUnit
   */
  async initializePayment(amount: number, transactionId: string, description: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/initialize`,
        {
          total_amount: amount,
          currency: 'XAF',
          transaction_id: transactionId,
          description: description,
          return_url: this.configService.get<string>('PAYUNIT_RETURN_URL'),
          notify_url: this.configService.get<string>('PAYUNIT_CALLBACK_URL'),
        },
        { headers: this.getHeaders() }
      );

      this.logger.log(`Paiement initialisé : ${transactionId}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        this.logger.error(
          `Erreur PayUnit (${error.response.status}): ${JSON.stringify(error.response.data)}`
        );
      } else {
        this.logger.error(`Erreur initialisation paiement : ${error.message}`);
      }
      throw error;
    }
  }
}
