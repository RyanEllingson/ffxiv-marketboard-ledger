process.env.NODE_ENV = "test";
const connection = require("../config/connection");
const User = require("../orm/user");
const Product = require("../orm/product");
const crypto = require("crypto");

const userApi = new User(connection);
const productApi = new Product(connection);

describe("Database transactions", () => {
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
            // Connection terminated
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
    const clearProducts = function() {
        const queryString = "DELETE FROM products";
        const dbQuery = function(resolve, reject) {
            connection.query(queryString, function(err, result) {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        };
        return new Promise(dbQuery);
    }
    describe("User class", () => {
        describe("Register new user", () => {
            it("should add a new user to the db and attach cookie session to request", async () => {
                await clearUsers();
                req = {
                    body: {
                        email: "test@test.com",
                        password: "password",
                        password2: "password"
                    },
                    session: {}
                };
                res = {
                    json: jest.fn()
                };
                await userApi.registerAndReturnUser.call(userApi, req, res);
                userId = res.json.mock.calls[0][0].insertId;
                const hash = crypto.createHash("sha256");
                hash.update(userId.toString());
                const hashedId = hash.digest("hex");
                sessionId = hashedId;
                expect(req.session.userId).toBe(hashedId);
                expect(res.json.mock.calls[0][0].affectedRows).toBe(1);
                expect(res.json.mock.calls[0][0].email).toBe("test@test.com");
            });
            it("should return an 'email is required' error", async () => {
                req = {
                    body: {
                        password: "password",
                        password2: "password"
                    }
                };
                res = {
                    json: jest.fn()
                };
    
                await userApi.registerAndReturnUser.call(userApi, req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].email).toBe("Email field is required");
            });
            it("should return an 'email is invalid' error", async () => {
                req = {
                    body: {
                        email: "a;sdlfja;dsf",
                        password: "password",
                        password2: "password"
                    }
                };
                res = {
                    json: jest.fn()
                };
    
                await userApi.registerAndReturnUser.call(userApi, req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].email).toBe("Email is invalid");
            });
            it("should return an 'email already in use' error", async () => {
                req = {
                    body: {
                        email: "test@test.com",
                        password: "password",
                        password2: "password"
                    }
                };
                res = {
                    json: jest.fn()
                };
    
                await userApi.registerAndReturnUser.call(userApi, req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].email).toBe("Email already in use");
            });
            it("should return a 'password is required' error", async () => {
                req = {
                    body: {
                        email: "test2@test.com",
                        password2: "password"
                    }
                };
                res = {
                    json: jest.fn()
                };
    
                await userApi.registerAndReturnUser.call(userApi, req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].password).toBe("Password field is required");
            });
            it("should return a 'passwords must match' error", async () => {
                req = {
                    body: {
                        email: "test2@test.com",
                        password: "password",
                        password2: "a;dkfj;sadfkj"
                    }
                };
                res = {
                    json: jest.fn()
                };
    
                await userApi.registerAndReturnUser.call(userApi, req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].password2).toBe("Passwords must match");
            });
            it("should return a 'confirm password required' error", async () => {
                req = {
                    body: {
                        email: "test2@test.com",
                        password: "password"
                    }
                };
                res = {
                    json: jest.fn()
                };
    
                await userApi.registerAndReturnUser.call(userApi, req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].password2).toBe("Confirm password field is required");
            });
        });
        describe("Log out from application", () => {
            it("should remove cookie session from request", () => {
                req = {
                    session: "something"
                };
                res = {
                    json: jest.fn()
                };
    
                userApi.logout(req, res);
                expect(req.session).toBeNull;
                expect(res.json.mock.calls[0][0].loggedOut).toBe(true);
            });
        });
        describe("Log into existing account", () => {
            it("should successfully log in and attach cookie session to request", async () => {
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
    
                await userApi.loginAndReturnUser.call(userApi, req, res);
                const hash = crypto.createHash("sha256");
                hash.update(userId.toString());
                const hashedId = hash.digest("hex");
                expect(req.session.userId).toBe(hashedId);
                expect(res.json.mock.calls[0][0].email).toBe("test@test.com");
            });
        });
    });
    describe("Product class", () => {
        describe("Add a new product", () => {
            it("should successfully add a new product", async () => {
                req = {
                    body: {
                        email: "test@test.com",
                        item_id: "1",
                        item_name: "test item",
                        image_url: "testurl.com"
                    },
                    session: {
                        userId: sessionId
                    }
                };
                res = {
                    json: jest.fn()
                };

                await productApi.addAndReturnProduct.call(productApi, req, res);
                expect(res.json.mock.calls[0][0].affectedRows).toBe(1);
            });
        });
    });
});