process.env.NODE_ENV = "test";
const connection = require("../config/connection");
const User = require("../orm/user");
const Product = require("../orm/product");
const Raw = require("../orm/raw");
const crypto = require("crypto");

const userApi = new User(connection);
const productApi = new Product(connection);
const rawApi = new Raw(connection);

describe("Database transactions", () => {
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
    };
    const clearRaws = function() {
        const queryString = "DELETE FROM raws";
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
    let req = {};
    let res = {};
    let userId;
    let sessionId;
    let productId;
    let rawId;
    beforeEach(() => {
        req = {};
        res = {};
    });
    beforeAll(async () => {
        await clearRaws();
        await clearProducts();
        await clearUsers();
        userId = null;
        sessionId = null;
        productId = null;
        rawId = null;
    });
    afterAll(() => {
        connection.end((err) => {
            // Connection terminated
        });
    });
    describe("User class", () => {
        describe("Register new user", () => {
            it("should add a new user to the db and attach cookie session to request", async () => {
                
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
                productId = res.json.mock.calls[0][0].insertId;
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
        describe("Get all products", () => {
            it("should successfully return all products in the db", async () => {
                req = {
                    body: {
                        email: "test@test.com"
                    },
                    session: {
                        userId: sessionId
                    }
                };
                res = {
                    json: jest.fn()
                };

                await productApi.getAndReturnProducts(req, res);
                expect(res.json.mock.calls[0][0].length).toBe(1);
                expect(res.json.mock.calls[0][0][0].item_name).toBe("test item");
            });
            it("should return an 'email not found' error", async () => {
                req = {
                    body: {
                        email: "blah@blah.com"
                    },
                    session: {
                        userId: sessionId
                    }
                };
                res = {
                    json: jest.fn()
                };

                await productApi.getAndReturnProducts(req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].email).toBe("Email not found");
            });
            it("should return an 'invalid credentials' error", async () => {
                req = {
                    body: {
                        email: "test@test.com"
                    },
                    session: {
                        userId: "adfipelrkashdlfk"
                    }
                };
                res = {
                    json: jest.fn()
                };

                await productApi.getAndReturnProducts(req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].userId).toBe("Invalid credentials");
            });
        });
    });
    describe("Raw class", () => {
        describe("Add a new raw", () => {
            it("should successfully add a new raw", async () => {
                req = {
                    body: {
                        item_id: 1,
                        item_name: "test raw",
                        image_url: "testurl.com",
                        email: "test@test.com"
                    },
                    session: {
                        userId: sessionId
                    }
                };
                res = {
                    json: jest.fn()
                };

                await rawApi.addAndReturnRawProto(req, res);
                rawId = res.json.mock.calls[0][0].insertId;
                expect(res.json.mock.calls[0][0].affectedRows).toBe(1);
            });
            it("should return an 'email not found' error", async () => {
                req = {
                    body: {
                        item_id: 2,
                        item_name: "test raw",
                        image_url: "testurl.com",
                        email: "blah@blah.com"
                    },
                    session: {
                        userId: sessionId
                    }
                };
                res = {
                    json: jest.fn()
                };

                await rawApi.addAndReturnRaw(req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].email).toBe("Email not found");
            });
            it("should return a 'raw already exists' error", async () => {
                req = {
                    body: {
                        item_id: 1,
                        item_name: "test raw",
                        image_url: "testurl.com",
                        email: "test@test.com"
                    },
                    session: {
                        userId: sessionId
                    }
                };
                res = {
                    json: jest.fn()
                };

                await rawApi.addAndReturnRaw(req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].raw).toBe("Raw already exists");
            });
            it("should return a 'product not found' error", async () => {
                req = {
                    body: {
                        item_id: 2,
                        item_name: "test item",
                        image_url: "testurl.com",
                        product_id: 0,
                        email: "test@test.com"
                    },
                    session: {
                        userId: sessionId
                    }
                };
                res = {
                    json: jest.fn()
                };

                await rawApi.addAndReturnRaw(req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].product).toBe("Product not found");
            });
            it("should return an 'invalid credentials' error", async () => {
                req = {
                    body: {
                        item_id: 2,
                        item_name: "test item",
                        image_url: "testurl.com",
                        email: "test@test.com"
                    },
                    session: {
                        userId: "hadfoiewuwr;alksdnf"
                    }
                };
                res = {
                    json: jest.fn()
                };

                await rawApi.addAndReturnRaw(req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].userId).toBe("Invalid credentials");
            });
        });
        describe("Assign a product to a raw", () => {
            it("should successfully assign a product to a raw", async () => {
                req = {
                    body: {
                        raw_id: rawId,
                        product_id: productId
                    },
                    session: {
                        userId: sessionId
                    }
                };
                res = {
                    json: jest.fn()
                };

                await rawApi.assignProductAndReturn(req, res);
                expect(res.json.mock.calls[0][0].affectedRows).toBe(1);
            });
            it("should return a 'raw not found' error", async () => {
                req = {
                    body: {
                        raw_id: 0,
                        product_id: productId
                    },
                    session: {
                        userId: sessionId
                    }
                };
                res = {
                    json: jest.fn()
                };

                await rawApi.assignProductAndReturn(req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].raw).toBe("Raw not found");
            });
            it("should return a 'product not found' error", async () => {
                req = {
                    body: {
                        raw_id: rawId,
                        product_id: 0
                    },
                    session: {
                        userId: sessionId
                    }
                };
                res = {
                    json: jest.fn()
                };

                await rawApi.assignProductAndReturn(req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].product).toBe("Product not found");
            });
            it("should return an 'invalid credentials' error", async () => {
                req = {
                    body: {
                        raw_id: rawId,
                        product_id: productId
                    },
                    session: {
                        userId: "poidfadsfalksdh;l"
                    }
                };
                res = {
                    json: jest.fn()
                };

                await rawApi.assignProductAndReturn(req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].userId).toBe("Invalid credentials");
            });
            it("should successfully remove product from a raw", async () => {
                req = {
                    body: {
                        raw_id: rawId,
                        product_id: null
                    },
                    session: {
                        userId: sessionId
                    }
                };
                res = {
                    json: jest.fn()
                };

                await rawApi.assignProductAndReturn(req, res);
                expect(res.json.mock.calls[0][0].affectedRows).toBe(1);
            });
        });
        describe("Get all raws", () => {
            it("should successfully return all raws in the db", async () => {
                req = {
                    body: {
                        email: "test@test.com"
                    },
                    session: {
                        userId: sessionId
                    }
                };
                res = {
                    json: jest.fn()
                };

                await rawApi.getAndReturnRaws(req, res);
                expect(res.json.mock.calls[0][0].length).toBe(1);
                expect(res.json.mock.calls[0][0][0].item_name).toBe("test raw");
            });
            it("should return an 'email not found' error", async () => {
                req = {
                    body: {
                        email: "blah@blah.com"
                    },
                    session: {
                        userId: sessionId
                    }
                };
                res = {
                    json: jest.fn()
                };

                await rawApi.getAndReturnRaws(req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].email).toBe("Email not found");
            });
            it("should return an 'invalid credentials' error", async () => {
                req = {
                    body: {
                        email: "test@test.com"
                    },
                    session: {
                        userId: "fja;dsfhioasdfhalsdkf"
                    }
                };
                res = {
                    json: jest.fn()
                };

                await rawApi.getAndReturnRaws(req, res);
                expect(res.json.mock.calls[0][0].error).toBe(true);
                expect(res.json.mock.calls[0][0].userId).toBe("Invalid credentials");
            });
        });
    });
});