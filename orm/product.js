const crypto = require("crypto");

class Product {
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
    doesProductExist(itemId) {
        const queryString = "SELECT * FROM products WHERE item_id = ?";
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
    async addProduct(req, user_id) {
        const { item_id, item_name, image_url } = req.body;
        const queryString = "INSERT INTO products SET ?";
        const exists = await this.doesProductExist(item_id);
        const dbQuery = (resolve, reject) => {
            if (exists) {
                return reject({product: "Product already exists"});
            }
            const hash = crypto.createHash("sha256");
            hash.update(user_id.toString());
            const hashedId = hash.digest("hex");
            if (req.session.userId !== hashedId) {
                return reject({userId: "Invalid credentials"});
            }
            this.connection.query(queryString, { item_id, item_name, image_url, user_id }, function(err, result) {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        };
        return new Promise(dbQuery);
    }
    async addAndReturnProductProto(req, res) {
        try {
            const userId = await this.findIdByEmail(req.body.email);
            const result = await this.addProduct(req, userId);
            res.json(result);
        } catch(err) {
            res.json({...err, error: true});
        }
    };
    get addAndReturnProduct() {
        return this.addAndReturnProductProto;
    }
}

module.exports = Product;