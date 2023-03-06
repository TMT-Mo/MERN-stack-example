class HttpError extends Error{
    constructor(message, errorCode){
        super(message); //Add a "message" property
        this.code = errorCode; // Add a "code" property
        this.errorMessage = message
    }
}


module.exports = HttpError