import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';

@Catch(HttpException)
export class CustomHttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status =
            exception.getStatus ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse = exception.getResponse();
       // console.log('exceptionResponse', exceptionResponse);
        const error =
            typeof exceptionResponse === 'string'
                ? exceptionResponse
                : (exceptionResponse as any).message || 'Unexpected error';

                const error_ = (exceptionResponse as any).error;

        response.status(status).json({
            code: status,
            success: false,
            messages: {
                error: error,
            },
            error:error_
            /* timestamp: new Date().toISOString(),
            path: request.url, */
        });
    }
}
