const crypto = require("crypto");

class User {
    constructor(connection) {
        this.connection = connection;
    }
    registerUser(userInfo) {
        const innerThis = this;
        const queryString = "INSERT INTO users SET ?";
        const dbQuery = function(resolve, reject) {
            const salt = crypto.randomBytes(8).toString("hex");
            const hashedPass = crypto.scryptSync(userInfo.password, salt, 64).toString("hex");
            innerThis.connection.query(queryString, { email: userInfo.email, password: `${hashedPass}.${salt}` }, function(err, result) {
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
            console.error(err);
            res.json({...err, error: true});
        }
    }
}

module.exports = User;

// const User = function(connection, crypto) {
//     this.registerUser = function(userInfo) {
//         const queryString = "INSERT INTO users SET ?";
//         const dbQuery = function(resolve, reject) {
//             const salt = crypto.randomBytes(8).toString("hex");
//             const hashedPass = crypto.scryptSync(userInfo.password, salt, 64).toString("hex");
//             connection.query(queryString, { email: userInfo.email, password: `${hashedPass}.${salt}` }, function(err, result) {
//                 if (err) {
//                     return reject(err);
//                 }
//                 return resolve(result);
//             });
//         };
//         return new Promise(dbQuery);
//     };
//     this.registerAndReturnUser = async function(req, res) {
//         console.log(this);
//         try {
//             const result = await this.registerUser(req.body);
//             const hash = crypto.createHash("sha256");
//             hash.update(result.insertId.toString());
//             const hashedId = hash.digest("hex");
//             req.session.userId = hashedId;
//             res.json({...result, email: req.body.email});
//         } catch(err) {
//             console.log(err);
//             res.json({...err, error: true});
//         }
//     };
// };

// User.prototype.registerUser = function(userInfo) {
//     const queryString = "INSERT INTO users SET ?";
//     const dbQuery = function(resolve, reject) {
//         const salt = this.crypto.randomBytes(8).toString("hex");
//         const hashedPass = this.crypto.scrypt(userInfo.password, salt, 64).toString("hex");
//         this.connection.query(queryString, { email: userInfo.email, password: `${hashedPass}.${salt}` }, function(err, result) {
//             if (err) {
//                 return reject(err);
//             }
//             return resolve(result);
//         });
//     };
//     return new Promise(dbQuery);
// };

// User.prototype.registerAndReturnUser = async function(req, res) {
//     console.log(this);
//     try {
//         const result = await this.registerUser(req.body);
//         const hash = crypto.createHash("sha256");
//         hash.update(result.insertId.toString());
//         req.session.userId = hashedId;
//         res.json({...result, email: req.body.email});
//     } catch(err) {
//         res.json({...err, error: true});
//     }
// };

// module.exports = User;