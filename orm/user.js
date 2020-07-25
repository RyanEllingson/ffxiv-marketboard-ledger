const crypto = require("crypto");
const Validator = require("validator");
const userValidator = require("../validation/user");

class User {
    constructor(connection) {
        this.connection = connection;
        this.validator = new userValidator(connection);
    }
    registerUser(userInfo) {
        const queryString = "INSERT INTO users SET ?";
        const dbQuery = async (resolve, reject) => {
            const {errors, isValid} = await this.validator.validateRegisterInput.call(this.validator, userInfo);
            if (!isValid) {
                return reject(errors);
            }
            const normalizedEmail = Validator.normalizeEmail(userInfo.email);
            const salt = crypto.randomBytes(8).toString("hex");
            const hashedPass = crypto.scryptSync(userInfo.password, salt, 64).toString("hex");
            this.connection.query(queryString, { email: normalizedEmail, password: `${hashedPass}.${salt}` }, function(err, result) {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        };
        return new Promise(dbQuery);
    }
    async registerAndReturnUser(req, res) {
        try {
            const result = await this.registerUser.call(this, req.body);
            const hash = crypto.createHash("sha256");
            hash.update(result.insertId.toString());
            const hashedId = hash.digest("hex");
            req.session.userId = hashedId;
            res.json({...result, email: req.body.email});
        } catch(err) {
            res.json({...err, error: true});
        }
    }
}

module.exports = User;