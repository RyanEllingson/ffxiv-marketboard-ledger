process.env.NODE_ENV = "test";
const connection = require("../config/connection");
const User = require("../orm/user");
const crypto = require("crypto");
const { hasUncaughtExceptionCaptureCallback } = require("process");

const userApi = new User(connection);

describe("User class", () => {
    let req = {};
    let res = {};
    beforeEach(() => {
        req = {};
        res = {};
    });
    let userId;
    let sessionId;
    afterAll(() => {
        connection.end((err) => {
            // Terminate connection
        });
    });
    const clearUsers = function() {
        const queryString = "DELETE FROM users";
        const dbQuery = function(resolve, reject) {
            connection.query(queryString, function(err, result) {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        };
        return new Promise(dbQuery);
    };
    describe("Register new user", () => {
        it("should add a new user to the db and attach cookie session to request", async () => {
            await clearUsers();
            req = {
                body: {
                    email: "test@test.com",
                    password: "password"
                },
                session: {}
            };
            res = {
                json: jest.fn()
            };
            await userApi.registerAndReturnUser.call(userApi, req, res);
            // console.log(res.json.mock.calls[0][0]);
            userId = res.json.mock.calls[0][0].insertId;
            const hash = crypto.createHash("sha256");
            hash.update(res.json.mock.calls[0][0].insertId.toString());
            const hashedId = hash.digest("hex");
            expect(req.session.userId).toBe(hashedId);
            expect(res.json.mock.calls[0][0].affectedRows).toBe(1);
            expect(res.json.mock.calls[0][0].email).toBe("test@test.com");
        });
    });
});