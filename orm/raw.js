const crypto = require("crypto");

class Raw {
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
    doesRawExist(itemId) {
        const queryString = "SELECT * FROM raws WHERE item_id = ?";
        const dbQuery = (resolve, reject) => {
            this.connection.query(queryString, [itemId], function(err, result) {
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
    }
    doesProductExist(productId) {
        const queryString = "SELECT * FROM products WHERE product_id = ?";
        const dbQuery = (resolve, reject) => {
            this.connection.query(queryString, [productId], function(err, result) {
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
    }
    async addRaw(req, user_id) {
        const { item_id, item_name, image_url, product_id } = req.body;
        const queryString = "INSERT INTO raws SET ?";
        const rawExists = await this.doesRawExist(item_id);
        let productExists = true;
        if (typeof product_id === "number") {
            productExists = await this.doesProductExist(product_id);
        }
        const dbQuery = (resolve, reject) => {
            if (rawExists) {
                return reject({raw: "Raw already exists"});
            }
            if (!productExists) {
                return reject({product: "Product not found"})
            }
            const hash = crypto.createHash("sha256");
            hash.update(user_id.toString());
            const hashedId = hash.digest("hex");
            if (req.session.userId !== hashedId) {
                return reject({userId: "Invalid credentials"});
            }
            this.connection.query(queryString, { item_id, item_name, image_url, product_id, user_id }, function(err, result) {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        };
        return new Promise(dbQuery);
    }
    async addAndReturnRawProto(req, res) {
        try {
            const userId = await this.findIdByEmail(req.body.email);
            const result = await this.addRaw(req, userId);
            res.json(result);
        } catch(err) {
            res.json({...err, error: true});
        }
    }
    get addAndReturnRaw() {
        return this.addAndReturnRawProto;
    }
    findIdByRaw(rawId) {
        const queryString = "SELECT user_id FROM raws WHERE raw_id = ?";
        const dbQuery = (resolve, reject) => {
            this.connection.query(queryString, [rawId], function(err, result) {
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
    }
    async assignProduct(req, user_id) {
        const { raw_id, product_id } = req.body;
        const queryString = "UPDATE raws SET product_id = ? WHERE raw_id = ?";
        let productExists = true;
        if (typeof product_id === "number"){
            productExists = await this.doesProductExist(product_id);
        }
        const dbQuery = (resolve, reject) => {
            if (!productExists) {
                return reject({product: "Product not found"});
            }
            const hash = crypto.createHash("sha256");
            hash.update(user_id.toString());
            const hashedId = hash.digest("hex");
            if (req.session.userId !== hashedId) {
                return reject({userId: "Invalid credentials"});
            }
            this.connection.query(queryString, [product_id, raw_id], function(err, result) {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        };
        return new Promise(dbQuery);
    }
    async assignProductAndReturnProto(req, res) {
        try {
            const userId = await this.findIdByRaw(req.body.raw_id);
            const result = await this.assignProduct(req, userId);
            res.json(result);
        } catch(err) {
            res.json({...err, error: true});
        }
    }
    get assignProductAndReturn() {
        return this.assignProductAndReturnProto;
    }
}

module.exports = Raw;