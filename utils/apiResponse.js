const http = require('http');

class ApiResponse {
    constructor(data, status, message, paginate) {
        this.success = status < 400,
            this.status = status,
            this.message = message,
            this.statusText = http.STATUS_CODES[`${this.status}`],
            this.data = data
        if (paginate) {
            this.paginate = paginate;
        }
    }
}

module.exports = ApiResponse;