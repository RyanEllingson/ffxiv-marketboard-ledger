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
                await clearProducts();
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
                await userApi.registerAndReturnUser(req, res);
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
    
                await userApi.registerAndReturnUser(req, res);
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
    
                await userApi.registerAndReturnUser(req, res);
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
    
                await userApi.registerAndReturnUser(req, res);
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
    
                await userApi.registerAndReturnUser(req, res);
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
    
                await userApi.registerAndReturnUser(req, res);
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
    
                await userApi.registerAndReturnUser(req, res);
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
    
                await userApi.loginAndReturnUser(req, res);
                const hash = crypto.createHash("sha256");
                hash.update(userId.toString());
                const hashedId = hash.digest("hex");
                expect(req.session.userId).toBe(hashedId);
                expect(res.json.mock.calls[0][0].email).toBe("test@test.com");
            });
            it("should return an 'email is required' error", async () => {
                req = {
                    body: {
                        password: "whatever"
                    }
                };
                res = {
                    json: jest.fn()
                };

                await userApi.loginAndReturnUser(req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].email).toBe("Email field is required");
            });
            it("should return an 'email is invalid' error", async () => {
                req = {
                    body: {
                        email: "alkdjf;adlkfj",
                        password: "password"
                    }
                };
                res = {
                    json: jest.fn()
                };

                await userApi.loginAndReturnUser(req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].email).toBe("Email is invalid");
            });
            it("should return a 'password is required' error", async () => {
                req = {
                    body: {
                        email: "test@test.com"
                    }
                };
                res = {
                    json: jest.fn()
                };

                await userApi.loginAndReturnUser(req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].password).toBe("Password field is required");
            });
            it("should return an 'email not found' error", async () => {
                req = {
                    body: {
                        email: "blah@blah.com",
                        password: "blahblah"
                    }
                };
                res = {
                    json: jest.fn()
                };

                await userApi.loginAndReturnUser(req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].email).toBe("Email not found");
            });
            it("should return an 'incorrect password' error", async () => {
                req = {
                    body: {
                        email: "test@test.com",
                        password: "blahblah"
                    }
                };
                res = {
                    json: jest.fn()
                };

                await userApi.loginAndReturnUser(req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].password).toBe("Incorrect password");
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

                await productApi.addAndReturnProduct(req, res);
                expect(res.json.mock.calls[0][0].affectedRows).toBe(1);
            });
            it("should return an 'email not found' error", async () => {
                req = {
                    body: {
                        email: "blah@blah.com",
                        item_id: "1",
                        item_name: "test item",
                        item_url: "testurl.com"
                    },
                    session: {
                        userId: sessionId
                    }
                };
                res = {
                    json: jest.fn()
                };

                await productApi.addAndReturnProduct(req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].email).toBe("Email not found");
            });
            it("should return a 'product already exists' error", async () => {
                req = {
                    body: {
                        email: "test@test.com",
                        item_id: 1,
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

                await productApi.addAndReturnProduct(req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].product).toBe("Product already exists");
            });
            it("should return an 'invalid credentials' error", async () => {
                req = {
                    body: {
                        email: "test@test.com",
                        item_id: 2,
                        item_name: "test item",
                        image_url: "testurl.com"
                    },
                    session: {
                        userId: "qerpqwpoeiuasdfka;"
                    }
                };
                res = {
                    json: jest.fn()
                };

                await productApi.addAndReturnProduct(req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].userId).toBe("Invalid credentials");
            });
        });
    });
});