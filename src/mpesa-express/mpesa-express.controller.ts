import { Controller, Post, Body, Logger, HttpException, HttpStatus, Get, Query, Param, Res } from '@nestjs/common';
import { MpesaExpressService } from './mpesa-express.service';
import { CreateMpesaExpressDto } from './dto/create-mpesa-express.dto';
import { Redis } from 'ioredis';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { PrismaService } from 'src/services/prisma.service';
import { PdfService } from 'src/services/pdf.service';
import { Response } from 'express';

interface STKCallback {
    Body: {
        stkCallback: {
            MerchantRequestID: string;
            CheckoutRequestID: string;
            ResultCode: number;
            ResultDesc: string;
        };
    };
}

interface PaymentStatus {status: 'PENDING' | 'COMPLETED' | 'FAILED';[key: string]: any;}

@Controller('mpesa')
export class MpesaExpressController {
    private readonly logger = new Logger(MpesaExpressController.name);
    private readonly redis: Redis;

    constructor(
        private readonly mpesaExpressService: MpesaExpressService,
        private readonly redisService: RedisService,
        private readonly prisma: PrismaService,
        private readonly pdfService: PdfService,
    ) {this.redis = this.redisService.getOrThrow();}

    @Post('/stkpush')
    async initiateSTKPush(@Body() createMpesaExpressDto: CreateMpesaExpressDto) {
        try {
            const result = await this.mpesaExpressService.stkPush(createMpesaExpressDto);
            return {
                success: true,
                data: result,
            };
        } catch (error) {
            this.logger.error(`STK Push failed: ${error.message}`);
            throw new HttpException('Failed to initiate payment', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('/callback')
    async handleSTKCallback(@Body() callback: STKCallback) {
        return this.mpesaExpressService.processCallback(callback);
    }

    @Get('/transactions')
    async listTransactions(@Query('limit') limit = '20') {
        const take = Math.min(parseInt(limit, 10) || 20, 100);
        return this.prisma.transaction.findMany({
            orderBy: { id: 'desc' },
            take,
        });
    }

    @Get('/receipt/:id')
    async downloadReceipt(@Param('id') id: string, @Res() res: Response) {
        try {
            const transactionId = parseInt(id, 10);
            const transaction = await this.prisma.transaction.findUnique({
                where: { id: transactionId },
            });

            if (!transaction) {
                throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
            }

            const pdfBuffer = await this.pdfService.generateReceipt(transaction);
            
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="receipt-${transaction.MpesaReceiptNumber || transaction.id}.pdf"`,
                'Content-Length': pdfBuffer.length,
            });

            res.send(pdfBuffer);
        } catch (error) {
            this.logger.error(`Receipt generation failed: ${error.message}`);
            throw new HttpException('Failed to generate receipt', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
