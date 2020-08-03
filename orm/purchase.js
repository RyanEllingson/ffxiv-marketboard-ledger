const Orm = require("./orm");

class Purchase extends Orm {
    doesRawExist(rawId) {
        const queryString = "SELECT * FROM raws WHERE raw_id = ?";
        const dbQuery = (resolve, reject) => {
            this.connection.query(queryString, [rawId], function(err, result) {
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
    async addPurchase(req, user_id) {
        const { raw_id, purchase_quantity, purchase_amount, purchase_time } = req.body;
        const queryString = "INSERT INTO purchases SET ?";
        const rawExists = await this.doesRawExist(raw_id);
        const dbQuery = (resolve, reject) => {
            if (!rawExists) {
                return reject({raw: "Raw not found"});
            }
            if (!this.validateCredentials(req, user_id)) {
                return reject({userId: "Invalid credentials"});
            }
            this.connection.query(queryString, { raw_id, user_id, purchase_quantity, purchase_amount, purchase_time }, function(err, result) {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        };
        return new Promise(dbQuery);
    }
    async addPurchaseAndReturnProto(req, res) {
        try {
            const userId = await this.findIdByEmail(req.body.email);
            const result = await this.addPurchase(req, userId);
            res.json(result);
        } catch(err) {
            res.json({...err, error: true});
        }
    }
    get addPurchaseAndReturn() {
        return this.addPurchaseAndReturnProto;
    }
}

module.exports = Purchase;