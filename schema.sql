-- schema.sql

DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;

CREATE TABLE products (
    id INTEGER PRIMARY KEY,
    name VARCHAR(20) NOT NULL,
    price NUMERIC(5, 2) NOT NULL
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (product_id)
        REFERENCES products (id)
);


INSERT INTO products (id, name, price)
VALUES 
(1000, 'Bubble Wrap', 4.99),
(2000, 'Fluffernutter', 2.99),
(3000, 'Chapstick', 1.99),
(4000, 'Post-its', 5.99),
(5000, 'Bubble Gum', 0.99),
(6000, 'Toothbrush', 3.99),
(7000, 'Socks', 6.99),
(8000, 'Velcro', 3.99);

SELECT setseed(0.23);

INSERT INTO orders (product_id, quantity)
SELECT 
    CASE mod(ceil(random() * s)::integer, 8)
        WHEN 0 THEN 1000
        WHEN 1 THEN 2000
        WHEN 2 THEN 3000
        WHEN 3 THEN 4000
        WHEN 4 THEN 5000
        WHEN 5 THEN 6000
        WHEN 6 THEN 7000
        WHEN 7 THEN 8000
    END AS product_id,
    ceil(random() * 100)::integer + 1 AS quantity
FROM generate_series(1, 3000000, 1) AS s;


-- EXPLAIN ANALYZE
-- SELECT 
--   p.*,
--   (
--     SELECT sum(quantity) * p.price FROM orders o
--     WHERE o.product_id = p.id
--   ) as product_revenue
-- FROM products p;


-- CREATE INDEX orders_product_fk ON orders(product_id);

