import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(private configService: ConfigService) {}

    private logger = new Logger('AuthServices');

    async generateToken() {
        try {
            const secret = this.configService.get<string>('CONSUMER_SECRET') || 'your_consumer_secret_here';
            const consumer = this.configService.get<string>('CONSUMER_KEY') || 'your_consumer_key_here';

            if (!secret || !consumer) {
                this.logger.error('Consumer key or secret not found');
                return null;
            }

            const auth = Buffer.from(`${consumer}:${secret}`).toString('base64');

            const response = await fetch(
                'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
                {
                    headers: {
                        authorization: `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                    method: 'GET',
                },
            );

            if (!response.ok) {
                this.logger.error(`Failed to get token: ${response.statusText}`);
                return null;
            }

            const data = await response.json();
            return data.access_token; // Only return the token part
        } catch (error) {
            this.logger.error(`Error: ${error.message}`);
            return null;
        }
    }
}
