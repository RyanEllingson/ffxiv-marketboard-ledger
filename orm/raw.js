const crypto = require("crypto");

class Raw {
    constructor(connection) {
        this.findIdByEmail = (email) => {
            const queryString = "SELECT user_id FROM users WHERE email = ?";
            const dbQuery = (resolve, reject) => {
                connection.query(queryString, [email], function(err, result) {
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
        };
        this.doesRawExist = (itemId) => {
            const queryString = "SELECT * FROM raws WHERE item_id = ?";
            const dbQuery = (resolve, reject) => {
                connection.query(queryString, [itemId], function(err, result) {
                    if (err) {
                        return reject(err);
                    }
                    if (result.length > 0) {
                        return resolve(true);
                    }
                    return resolve(false);
                });
            };
            return new Promise(dbQuery);
        };
        this.addRaw = async (req, user_id) => {
            const { item_id, item_name, image_url, product_id } = req.body;
            const queryString = "INSERT INTO raws SET ?";
            const exists = await this.doesRawExist(item_id);
            const dbQuery = (resolve, reject) => {
                if (exists) {
                    return reject({raw: "Raw already exists"});
                }
                const hash = crypto.createHash("sha256");
                hash.update(user_id.toString());
                const hashedId = hash.digest("hex");
                if (req.session.userId !== hashedId) {
                    return reject({userId: "Invalid credentials"});
                }
                connection.query(queryString, { item_id, item_name, image_url, user_id, product_id }, function(err, result) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(result);
                });
            };
            return new Promise(dbQuery);
        };
        this.addAndReturnRaw = async (req, res) => {
            try {
                const userId = await this.findIdByEmail(req.body.email);
                const result = await this.addRaw(req, userId);
                res.json(result);
            } catch(err) {
                res.json({...err, error: true});
            }
        };
        this.findIdByRaw = (rawId) => {
            const queryString = "SELECT user_id FROM raws WHERE raw_id = ?";
            const dbQuery = (resolve, reject) => {
                connection.query(queryString, [rawId], function(err, result) {
                    if (err) {
                        return reject(err);
                    }
                    if (result.length < 1) {
                        return reject({raw: "Raw not found"});
                    }
                    return resolve(result[0].user_id);
                });
            };
            return new Promise(dbQuery);
        };
        this.assignProduct = (req, user_id) => {
            const { raw_id, product_id } = req.body;
            const queryString = "UPDATE raws SET ? WHERE raw_id = ?";
            const dbQuery = (resolve, reject) => {
                const hash = crypto.createHash("sha256");
                hash.update(user_id.toString());
                const hashedId = hash.digest("hex");
                if (req.session.userId !== hashedId) {
                    return reject({userId: "Invalid credentials"});
                }
                connection.query(queryString, { product_id }, [raw_id], function(err, result) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(result);
                });
            };
            return new Promise(dbQuery);
        };
        this.assignProductAndReturn = async (req, res) => {
            try {
                const userId = await this.findIdByRaw(req.body.raw_id);
                const result = await this.assignProduct(req, userId);
                res.json(result);
            } catch(err) {
                res.json({...err, error: true});
            }
        };
    }
}

module.exports = Raw;