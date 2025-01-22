class ResponseModel {
  constructor(success, message, data = null, error = null, statusCode = 200) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.error = error;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      success: this.success,
      message: this.message,
      data: this.data,
      error: this.error,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
    };
  }
}

module.exports = ResponseModel;
