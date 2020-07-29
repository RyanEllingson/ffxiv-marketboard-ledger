const Validator = require("validator");

class userValidator {
    constructor(connection) {
        this.isEmpty = (obj) => {
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    return false;
                }
            }
            return true;
        };
        this.checkForEmail = (email) => {
            const dbQuery = (resolve, reject) => {
                const queryString = "SELECT * FROM users WHERE email = ?";
                connection.query(queryString, [email], function(err, result) {
                    if (result.length > 0) {
                        return reject(false);
                    }
                    return resolve(true);
                });
            };
            return new Promise(dbQuery);
        };
        this.validateRegisterInput = async (data) => {
            const errors = {};

            const email = data.email ? data.email : "";
            const password = data.password ? data.password : "";
            const password2 = data.password2 ? data.password2 : "";
    
            if (Validator.isEmpty(email)) {
                errors.email = "Email field is required";
            } else if (!Validator.isEmail(email)) {
                errors.email = "Email is invalid";
            }
            try {
                await this.checkForEmail(email);
            } catch {
                errors.email = "Email already in use";
            }
            
            if (Validator.isEmpty(password)) {
                errors.password = "Password field is required";
            }
    
            if (!Validator.equals(password, password2)) {
                errors.password2 = "Passwords must match";
            }
    
            if (Validator.isEmpty(password2)) {
                errors.password2 = "Confirm password field is required";
            }
    
            return {
                errors,
                isValid: this.isEmpty(errors)
            };
        };
        this.validateLoginInput = (data) => {
            const errors = {};

            const email = data.email ? data.email : "";
            const password = data.password ? data.password : "";
    
            if (Validator.isEmpty(email)) {
                errors.email = "Email field is required";
            } else if (!Validator.isEmail(email)) {
                errors.email = "Email is invalid";
            }
    
            if (Validator.isEmpty(password)) {
                errors.password = "Password field is required";
            }
    
            return {
                errors,
                isValid: this.isEmpty(errors)
            };
        };
    }
}

module.exports = userValidator;