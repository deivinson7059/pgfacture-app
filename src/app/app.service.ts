import { Injectable } from '@nestjs/common';
import { apiResponse } from './common/interfaces/common.interface';

@Injectable()
export class AppService {
    getHello(): apiResponse {
        return {
            message: "Bienvenidos"
        }
    }
}
