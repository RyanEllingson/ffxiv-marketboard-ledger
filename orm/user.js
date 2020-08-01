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
            const {errors, isValid} = await this.validator.validateRegisterInput(userInfo);
            if (!isValid) {
                return reject(errors);
            }
            const normalizedEmail = Validator.normalizeEmail(userInfo.email);
            const salt = crypto.randomBytes(8).toString("hex");
            const hashedPass = crypto.scryptSync(userInfo.password, salt, 64).toString("hex");
            this.connection.query(queryString, {email: normalizedEmail, password: `${hashedPass}.${salt}`}, function(err, result) {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        };
        return new Promise(dbQuery);
    }
    async registerAndReturnUserProto(req, res) {
        try {
            const result = await this.registerUser(req.body);
            const hash = crypto.createHash("sha256");
            hash.update(result.insertId.toString());
            const hashedId = hash.digest("hex");
            req.session.userId = hashedId;
            res.json({...result, email: req.body.email});
        } catch(err) {
            res.json({...err, error: true});
        }
    }
    get registerAndReturnUser() {
        return this.registerAndReturnUserProto;
    }
    logout(req, res) {
        req.session = null;
        res.json({loggedOut: true});
    }
    login(loginInfo) {
        const queryString = "SELECT * FROM users WHERE email = ?";
        const dbQuery = (resolve, reject) => {
            const {errors, isValid} = this.validator.validateLoginInput(loginInfo);
            if (!isValid) {
                return reject(errors);
            }
            const normalizedEmail = Validator.normalizeEmail(loginInfo.email);
            this.connection.query(queryString, [normalizedEmail], function(err, result) {
                if (err) {
                    return reject(err);
                }
                if (result.length < 1) {
                    return reject({email: "Email not found"});
                }
                const [hash, salt] = result[0].password.split(".");
                const hashedPass = crypto.scryptSync(loginInfo.password, salt, 64).toString("hex");
                if(!Validator.equals(hash, hashedPass)) {
                    return reject({password: "Incorrect password"});
                }
                return resolve(result[0]);
            });
        };
        return new Promise(dbQuery);
    }
    async loginAndReturnUserProto(req, res) {
        try {
            const result = await this.login(req.body);
            const hash = crypto.createHash("sha256");
            hash.update(result.user_id.toString());
            const hashedId = hash.digest("hex");
            req.session.userId = hashedId;
            res.json({email: result.email});
        } catch(err) {
            res.json({...err, error: true});
        }
    }
    get loginAndReturnUser() {
        return this.loginAndReturnUserProto;
    }
}

module.exports = User;