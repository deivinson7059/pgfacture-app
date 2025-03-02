export enum TaskFrequency {
    IMMEDIATELY = 'immediately',
    MINUTE = 'minute',
    HOURLY = 'hourly',
    DAILY = 'daily',
    WEEKLY = 'weekly',
    BIWEEKLY = 'biweekly',
    MONTHLY = 'monthly',
    YEARLY = 'yearly'
}

export enum ExecutionTime {
    H00 = '00:00',
    H01 = '01:00',
    H02 = '02:00',
    H03 = '03:00',
    H04 = '04:00',
    H05 = '05:00',
    H06 = '06:00',
    H07 = '07:00',
    H08 = '08:00',
    H09 = '09:00',
    H10 = '10:00',
    H11 = '11:00',
    H12 = '12:00',
    H13 = '13:00',
    H14 = '14:00',
    H15 = '15:00',
    H16 = '16:00',
    H17 = '17:00',
    H18 = '18:00',
    H19 = '19:00',
    H20 = '20:00',  
    H21 = '21:00',
    H22 = '22:00',
    H221 = '22:17',
    H23 = '23:00' 
}

export enum TaskType {
    CRON = 'cron',
    API = 'api'
}
export enum TaskMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE'
}

export enum TaskAction {
    SEND_EMAIL = 'send_email',
    NONE = 'none'
}

export enum TaskStatus {
    PENDING = 'pending',
    RUNNING = 'running',
    SUCCESS = 'success',
    FAILED = 'failed'
}