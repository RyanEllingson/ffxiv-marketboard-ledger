const crypto = require("crypto");

class Orm {
    constructor(connection) {
        this.connection = connection;
    }
    findIdByEmail(email) {
        const queryString = "SELECT user_id FROM users WHERE email = ?";
        const dbQuery = (resolve, reject) => {
            this.connection.query(queryString, [email], function(err, result) {
                if (err) {
                    return reject(err);
                }
                if (result.length < 1) {
                    return reject({email: "Email not found"});
                }
                return resolve(result[0].user_id);
            });
        };
        return new Promise(dbQuery);
    }
    validateCredentials(req, user_id) {
        let validated;
        const hash = crypto.createHash("sha256");
        hash.update(user_id.toString());
        const hashedId = hash.digest("hex");
        if (req.session.userId === hashedId) {
            validated = true;
        } else {
            validated = false;
        }
        return validated;
    }
}

module.exports = Orm;