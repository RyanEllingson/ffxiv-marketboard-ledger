CREATE TABLE users
(
    user_id int NOT NULL AUTO_INCREMENT,
    email varchar(255) NOT NULL,
    password varchar(255) NOT NULL,
    PRIMARY KEY (user_id)
);

CREATE TABLE products
(
    product_id int NOT NULL AUTO_INCREMENT,
    item_id int NOT NULL,
    item_name varchar(255) NOT NULL,
    image_url varchar(255),
    user_id int NOT NULL,
    PRIMARY KEY (product_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE raws
(
    raw_id int NOT NULL AUTO_INCREMENT,
    item_id int NOT NULL,
    item_name varchar(255) NOT NULL,
    image_url varchar(255),
    user_id int NOT NULL,
    product_id int,
    PRIMARY KEY (raw_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE purchases
(
    purchase_id int NOT NULL AUTO_INCREMENT,
    raw_id int NOT NULL,
    user_id int NOT NULL,
    purchase_quantity int NOT NULL,
    purchase_amount int NOT NULL,
    purchase_time datetime NOT NULL,
    PRIMARY KEY (purchase_id),
    FOREIGN KEY (raw_id) REFERENCES raws(raw_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE sales
(
    sale_id int NOT NULL AUTO_INCREMENT,
    product_id int NOT NULL,
    user_id int NOT NULL,
    sale_quantity int NOT NULL,
    sale_amount int NOT NULL,
    sale_time datetime NOT NULL,
    PRIMARY KEY (sale_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);