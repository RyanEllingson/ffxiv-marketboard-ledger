const Orm = require("./orm");

class Product extends Orm {
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
            if (!this.validateCredentials (req, user_id)) {
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
    }
    get addAndReturnProduct() {
        return this.addAndReturnProductProto;
    }
    getProducts(req, user_id) {
        const queryString = "SELECT * FROM products WHERE user_id = ?";
        const dbQuery = (resolve, reject) => {
            if (!this.validateCredentials(req, user_id)) {
                return reject({userId: "Invalid credentials"});
            }
            this.connection.query(queryString, [user_id], function(err, result) {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        };
        return new Promise(dbQuery);
    }
    async getAndReturnProductsProto(req, res) {
        try {
            const userId = await this.findIdByEmail(req.body.email);
            const result = await this.getProducts(req, userId);
            res.json(result);
        } catch(err) {
            res.json({...err, error: true});
        }
    }
    get getAndReturnProducts() {
        return this.getAndReturnProductsProto;
    }
}

module.exports = Product;