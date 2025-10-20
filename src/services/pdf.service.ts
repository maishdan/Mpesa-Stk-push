import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

interface ReceiptData {
    id: number;
    MpesaReceiptNumber: string;
    Amount: number;
    PhoneNumber: string;
    TransactionDate: Date;
    status: string;
    CheckoutRequestID: string;
    AccountReference?: string;
}

@Injectable()
export class PdfService {
    private readonly logger = new Logger(PdfService.name);

    async generateReceipt(transaction: ReceiptData): Promise<Buffer> {
        let browser: puppeteer.Browser | null = null;
        
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            
            const html = this.generateReceiptHTML(transaction);
            await page.setContent(html, { waitUntil: 'networkidle0' });
            
            const pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px'
                }
            });
            
            return Buffer.from(pdf);
        } catch (error) {
            this.logger.error(`PDF generation failed: ${error.message}`);
            throw new Error('Failed to generate PDF receipt');
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    private generateReceiptHTML(transaction: ReceiptData): string {
        const formatDate = (date: Date) => {
            return new Intl.DateTimeFormat('en-KE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: 'Africa/Nairobi'
            }).format(new Date(date));
        };

        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('en-KE', {
                style: 'currency',
                currency: 'KES'
            }).format(amount);
        };

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>M-Pesa Receipt</title>
            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: #f8f9fa;
                    color: #333;
                }
                .receipt-container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }
                .header {
                    background: linear-gradient(135deg, #27ae60, #2ecc71);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: bold;
                }
                .header p {
                    margin: 10px 0 0 0;
                    font-size: 16px;
                    opacity: 0.9;
                }
                .content {
                    padding: 30px;
                }
                .status-badge {
                    display: inline-block;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: 14px;
                    text-transform: uppercase;
                    margin-bottom: 20px;
                }
                .status-completed {
                    background-color: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                .status-failed {
                    background-color: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                .status-pending {
                    background-color: #fff3cd;
                    color: #856404;
                    border: 1px solid #ffeaa7;
                }
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px 0;
                    border-bottom: 1px solid #e9ecef;
                }
                .detail-row:last-child {
                    border-bottom: none;
                }
                .detail-label {
                    font-weight: 600;
                    color: #495057;
                    flex: 1;
                }
                .detail-value {
                    font-weight: 500;
                    color: #212529;
                    flex: 2;
                    text-align: right;
                }
                .amount {
                    font-size: 24px;
                    font-weight: bold;
                    color: #27ae60;
                }
                .footer {
                    background-color: #f8f9fa;
                    padding: 20px 30px;
                    text-align: center;
                    border-top: 1px solid #e9ecef;
                }
                .footer p {
                    margin: 5px 0;
                    color: #6c757d;
                    font-size: 14px;
                }
                .qr-placeholder {
                    width: 100px;
                    height: 100px;
                    background-color: #e9ecef;
                    margin: 20px auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    color: #6c757d;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <div class="header">
                    <h1>🚀 Daniwest Tech Sol</h1>
                    <p>M-Pesa Payment Receipt</p>
                </div>
                
                <div class="content">
                    <div class="status-badge status-${transaction.status.toLowerCase()}">
                        ${transaction.status}
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Receipt Number:</span>
                        <span class="detail-value">${transaction.MpesaReceiptNumber || 'N/A'}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Amount:</span>
                        <span class="detail-value amount">${formatCurrency(transaction.Amount)}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Phone Number:</span>
                        <span class="detail-value">${transaction.PhoneNumber}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Transaction Date:</span>
                        <span class="detail-value">${formatDate(transaction.TransactionDate)}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Transaction ID:</span>
                        <span class="detail-value">${transaction.id}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Checkout Request ID:</span>
                        <span class="detail-value" style="font-size: 12px; word-break: break-all;">${transaction.CheckoutRequestID}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="detail-label">Account Reference:</span>
                        <span class="detail-value">${transaction.AccountReference || 'Daniwest Tech Sol'}</span>
                    </div>
                </div>
                
                <div class="footer">
                    <div class="qr-placeholder">
                        QR Code
                    </div>
                    <p><strong>Thank you for your payment!</strong></p>
                    <p>For support, contact: support@daniwesttechsol.com</p>
                    <p>Generated on: ${formatDate(new Date())}</p>
                    <p style="font-size: 12px; color: #adb5bd;">
                        This is a computer-generated receipt. No signature required.
                    </p>
                </div>
            </div>
        </body>
        </html>
        `;
    }
}