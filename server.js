const express = require("express");
const cookieSession = require("cookie-session");
const connection = require("./config/connection");
const User = require("./orm/user");

const app = express();
const PORT = process.env.PORT || 3000;
const cookieKey = process.env.COOKIE_KEY || "lfasdj;fkladsj";

const userApi = new User(connection);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieSession({
    keys: [cookieKey]
}));

app.post("/api/users/register", function(req, res) {
    userApi.registerAndReturnUser.call(userApi, req, res);
});
app.get("/api/users/logout", userApi.logout);
app.post("/api/users/login", function(req, res) {
    userApi.loginAndReturnUser.call(userApi, req, res);
});

app.listen(PORT, function() {
    console.log("App listening on PORT: " + PORT);
});