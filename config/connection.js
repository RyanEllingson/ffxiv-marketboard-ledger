const mysql = require("mysql");

const env = process.env.NODE_ENV || "development";
let config;
if (process.env.CI) {
    config = require(__dirname + "/config.json").test;
} else {
    config = require(__dirname + "/config.json")[env];
}

let connection;
if (config.use_env_variable) {
    connection = mysql.createConnection(process.env.JAWSDB_URL);
} else {
    connection = mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database
    });
}

connection.connect(function(err) {
    if (err) {
        console.error("error connecting: " + err);
    } else {
        console.log("connected as id " + connection.threadId);
    }
});

module.exports = connection;