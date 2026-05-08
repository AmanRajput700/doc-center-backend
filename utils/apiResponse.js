const http = require('http');

class ApiResponse {
    constructor(data, status, message, paginate = {}) {
        this.data = data,
            this.status = status,
            this.message = message,
            this.statusText = http.STATUS_CODES[`${this.status}`],
            this.paginate = paginate
    }
}

module.exports = ApiResponse;