import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    @Get('api')
    health() {
        return {
            name: 'Daniwest M-Pesa STK API',
            status: 'ok',
            version: '1.0.0',
            endpoints: {
                stkpush: '/api/mpesa/stkpush',
                callback: '/api/mpesa/callback',
            },
        };
    }

    @Get()
    root() {
        // Redirect users to the STK form page
        return { redirect: '/', page: 'STK Form', info: 'Open / to view the STK form' };
    }
}


