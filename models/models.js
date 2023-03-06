class ErrorModel {
    constructor(errorMessage, errorCode){
        this.code = errorCode; // Add a "code" property
        this.errorMessage = errorMessage

    }
}

exports.ErrorModel = ErrorModel