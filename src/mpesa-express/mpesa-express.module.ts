import { Module } from '@nestjs/common';
import { MpesaExpressService } from './mpesa-express.service';
import { MpesaExpressController } from './mpesa-express.controller';
import { AuthService } from 'src/services/auth.service';
import { PrismaService } from 'src/services/prisma.service';
import { PdfService } from 'src/services/pdf.service';

@Module({
    imports: [],
    controllers: [MpesaExpressController],
    providers: [MpesaExpressService, AuthService, PrismaService, PdfService],
})
export class MpesaExpressModule {}
