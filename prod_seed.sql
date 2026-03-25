--
-- PostgreSQL database dump
--

\restrict vnuFwxmYffBnhuWZ7bVcp3nP5egNMI7NkQIWScK46idmJY6f8ZMJqcIO60XRgf8

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS orders_buyer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.carts DROP CONSTRAINT IF EXISTS carts_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cart_items DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cart_items DROP CONSTRAINT IF EXISTS cart_items_cart_id_fkey;
DROP INDEX IF EXISTS public.ix_users_username;
DROP INDEX IF EXISTS public.ix_users_user_id;
DROP INDEX IF EXISTS public.ix_users_email_address;
DROP INDEX IF EXISTS public.ix_products_product_name;
DROP INDEX IF EXISTS public.ix_products_product_id;
DROP INDEX IF EXISTS public.ix_orders_order_id;
DROP INDEX IF EXISTS public.ix_order_items_order_items_id;
DROP INDEX IF EXISTS public.ix_categories_category_name;
DROP INDEX IF EXISTS public.ix_categories_category_id;
DROP INDEX IF EXISTS public.ix_carts_cart_id;
DROP INDEX IF EXISTS public.ix_cart_items_cart_item_id;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_pkey;
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS orders_pkey;
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS order_items_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS ONLY public.carts DROP CONSTRAINT IF EXISTS carts_pkey;
ALTER TABLE IF EXISTS ONLY public.cart_items DROP CONSTRAINT IF EXISTS cart_items_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.products ALTER COLUMN product_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.orders ALTER COLUMN order_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.order_items ALTER COLUMN order_items_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.categories ALTER COLUMN category_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.carts ALTER COLUMN cart_id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cart_items ALTER COLUMN cart_item_id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_user_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.products_product_id_seq;
DROP TABLE IF EXISTS public.products;
DROP SEQUENCE IF EXISTS public.orders_order_id_seq;
DROP TABLE IF EXISTS public.orders;
DROP SEQUENCE IF EXISTS public.order_items_order_items_id_seq;
DROP TABLE IF EXISTS public.order_items;
DROP SEQUENCE IF EXISTS public.categories_category_id_seq;
DROP TABLE IF EXISTS public.categories;
DROP SEQUENCE IF EXISTS public.carts_cart_id_seq;
DROP TABLE IF EXISTS public.carts;
DROP SEQUENCE IF EXISTS public.cart_items_cart_item_id_seq;
DROP TABLE IF EXISTS public.cart_items;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.cart_items (
    cart_item_id integer NOT NULL,
    cart_id integer,
    product_id integer,
    quantity integer
);


ALTER TABLE public.cart_items OWNER TO admin;

--
-- Name: cart_items_cart_item_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.cart_items_cart_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.cart_items_cart_item_id_seq OWNER TO admin;

--
-- Name: cart_items_cart_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.cart_items_cart_item_id_seq OWNED BY public.cart_items.cart_item_id;


--
-- Name: carts; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.carts (
    cart_id integer NOT NULL,
    user_id integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.carts OWNER TO admin;

--
-- Name: carts_cart_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.carts_cart_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.carts_cart_id_seq OWNER TO admin;

--
-- Name: carts_cart_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.carts_cart_id_seq OWNED BY public.carts.cart_id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.categories (
    category_id integer NOT NULL,
    category_name character varying,
    icon_name character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.categories OWNER TO admin;

--
-- Name: categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.categories_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.categories_category_id_seq OWNER TO admin;

--
-- Name: categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.categories_category_id_seq OWNED BY public.categories.category_id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.order_items (
    order_items_id integer NOT NULL,
    order_id integer,
    product_id integer,
    quantity integer,
    price_each double precision
);


ALTER TABLE public.order_items OWNER TO admin;

--
-- Name: order_items_order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.order_items_order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_items_order_items_id_seq OWNER TO admin;

--
-- Name: order_items_order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.order_items_order_items_id_seq OWNED BY public.order_items.order_items_id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.orders (
    order_id integer NOT NULL,
    buyer_id integer,
    status character varying,
    total_price double precision,
    ordered_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.orders OWNER TO admin;

--
-- Name: orders_order_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.orders_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.orders_order_id_seq OWNER TO admin;

--
-- Name: orders_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.orders_order_id_seq OWNED BY public.orders.order_id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.products (
    product_id integer NOT NULL,
    category_id integer,
    product_name character varying,
    product_desc character varying,
    product_img character varying,
    price double precision,
    avail_stocks integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.products OWNER TO admin;

--
-- Name: products_product_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.products_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.products_product_id_seq OWNER TO admin;

--
-- Name: products_product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.products_product_id_seq OWNED BY public.products.product_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    username character varying,
    password_hash character varying,
    full_name character varying,
    contact_number character varying,
    email_address character varying,
    role character varying,
    image character varying
);


ALTER TABLE public.users OWNER TO admin;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_user_id_seq OWNER TO admin;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admin
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: cart_items cart_item_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cart_items ALTER COLUMN cart_item_id SET DEFAULT nextval('public.cart_items_cart_item_id_seq'::regclass);


--
-- Name: carts cart_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.carts ALTER COLUMN cart_id SET DEFAULT nextval('public.carts_cart_id_seq'::regclass);


--
-- Name: categories category_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.categories ALTER COLUMN category_id SET DEFAULT nextval('public.categories_category_id_seq'::regclass);


--
-- Name: order_items order_items_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.order_items ALTER COLUMN order_items_id SET DEFAULT nextval('public.order_items_order_items_id_seq'::regclass);


--
-- Name: orders order_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.orders ALTER COLUMN order_id SET DEFAULT nextval('public.orders_order_id_seq'::regclass);


--
-- Name: products product_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.products ALTER COLUMN product_id SET DEFAULT nextval('public.products_product_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.cart_items (cart_item_id, cart_id, product_id, quantity) FROM stdin;
6	1	13	1
\.


--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.carts (cart_id, user_id, created_at, updated_at) FROM stdin;
1	1	2026-03-19 15:14:30.532024+00	\N
2	2	2026-03-20 08:20:53.409284+00	\N
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.categories (category_id, category_name, icon_name, created_at, updated_at) FROM stdin;
1	Pizzas	local_pizza	2026-03-19 15:08:31.713739+00	\N
2	Pasta	dinner_dining	2026-03-19 15:08:31.713739+00	\N
3	Beverages	local_cafe	2026-03-19 15:08:31.713739+00	\N
4	Salad	fork_spoon	2026-03-20 07:55:41.811468+00	\N
5	Desserts	icecream	2026-03-20 08:00:19.466139+00	\N
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.order_items (order_items_id, order_id, product_id, quantity, price_each) FROM stdin;
2	2	13	1	300
3	2	11	1	150
4	2	19	1	200
5	2	26	1	300
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.orders (order_id, buyer_id, status, total_price, ordered_at, updated_at) FROM stdin;
1	2	completed	250	2026-03-20 08:21:07.585552+00	2026-03-20 08:21:23.744036+00
2	1	pending	950	2026-03-21 05:36:33.644992+00	\N
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.products (product_id, category_id, product_name, product_desc, product_img, price, avail_stocks, created_at, updated_at, deleted_at) FROM stdin;
2	1	Neapolitan Pizza	The authentic taste of Naples, fired at 900 degrees	https://res.cloudinary.com/du7mvcm09/image/upload/v1773988397/food-ecommerce/products/hrf9stgkz4kgriwjwmhk.png	150	100	2026-03-20 06:33:18.004035+00	\N	\N
6	1	Margherita Pizza	The Italian icon. San Marzano tomato sauce, fresh mozzarella, basil, and a drizzle of EVOO	https://res.cloudinary.com/du7mvcm09/image/upload/v1773992409/food-ecommerce/products/wnchisowzn2srecbmmik.png	200	200	2026-03-20 07:40:10.021068+00	\N	\N
7	1	Pepperoni Pizza	A fan favorite. Loaded with premium zesty pepperoni and melted mozzarella over house red sauce	https://res.cloudinary.com/du7mvcm09/image/upload/v1773992460/food-ecommerce/products/uwuc8xqk2z6w7asib2jg.png	250	200	2026-03-20 07:41:01.123984+00	\N	\N
8	1	Sausage Pizza	Savory comfort. Herb-seasoned Italian sausage crumbles, roasted garlic, and stretchy mozzarella.	https://res.cloudinary.com/du7mvcm09/image/upload/v1773992516/food-ecommerce/products/qlirzrxjqv16kiokbx8k.png	300	200	2026-03-20 07:41:57.741588+00	\N	\N
9	1	Classic Pizza	Our signature cheese blend on a traditional tomato base. Simple, timeless, and perfectly baked	https://res.cloudinary.com/du7mvcm09/image/upload/v1773992548/food-ecommerce/products/cn8qbrn9mzw8gbqb6zyp.png	250	200	2026-03-20 07:42:29.40958+00	\N	\N
10	3	Hot Cappuccino	Velvety steamed milk over rich espresso, finished with a deep layer of silky foam.	https://res.cloudinary.com/du7mvcm09/image/upload/v1773992651/food-ecommerce/products/avjz94x6zm7vzn0pvsiy.png	100	100	2026-03-20 07:44:12.243512+00	\N	\N
12	3	Lemon Tea	A bright, soothing blend of premium black tea infused with fresh citrus and a hint of honey	https://res.cloudinary.com/du7mvcm09/image/upload/v1773992750/food-ecommerce/products/hqzdymvhxdwtq4shkczm.png	99	100	2026-03-20 07:45:51.045871+00	\N	\N
14	2	Spaghetti Twist	Classic long-strand pasta served with our slow-simmered, herb-infused marinara sauce	https://res.cloudinary.com/du7mvcm09/image/upload/v1773992868/food-ecommerce/products/cltoxcaqykxn8ahn2pkj.png	200	200	2026-03-20 07:47:48.806171+00	\N	\N
15	2	Trenette Pesto	Flat, narrow ribbons of pasta coated in vibrant basil pesto, pine nuts, and Parmesan	https://res.cloudinary.com/du7mvcm09/image/upload/v1773992907/food-ecommerce/products/xmft0eqmrwtyow0lunnn.png	400	400	2026-03-20 07:48:28.387378+00	\N	\N
18	4	Caesar Salad	Crisp romaine hearts tossed in creamy dressing with garlic croutons and shaved Parmesan	https://res.cloudinary.com/du7mvcm09/image/upload/v1773993380/food-ecommerce/products/c3owhoscsl4qhbohfrxk.png	150	999	2026-03-20 07:56:21.477511+00	\N	\N
20	4	Tuna Salad	Flaked line-caught tuna, cherry tomatoes, and cucumber on a bed of garden greens with lemon oil	https://res.cloudinary.com/du7mvcm09/image/upload/v1773993540/food-ecommerce/products/kefedjlsop6eohuqdcjw.png	300	999	2026-03-20 07:59:01.268795+00	\N	\N
21	4	Vegetable Salad	A seasonal rainbow of crunchy garden veggies and leaf lettuce served with a balsamic herb dressing	https://res.cloudinary.com/du7mvcm09/image/upload/v1773993570/food-ecommerce/products/zlyiwl1t4wlony2b4ay8.png	300	999	2026-03-20 07:59:31.478611+00	\N	\N
22	5	Belgian Waffle	Thick, golden, and crisp. Served with a dusting of powdered sugar and maple syrup	https://res.cloudinary.com/du7mvcm09/image/upload/v1773994045/food-ecommerce/products/ubtmb8kwsd0pfvia2fsq.png	400	999	2026-03-20 08:07:25.552449+00	\N	\N
23	5	Blackberry Pie	Tart wild blackberries in a flaky, buttery crust, baked until bubbling and sweet	https://res.cloudinary.com/du7mvcm09/image/upload/v1773994070/food-ecommerce/products/wyscvjwelahjmfsf081t.png	350	998	2026-03-20 08:07:51.665988+00	\N	\N
24	5	Tiramisu Cake	Espresso-soaked sponge layers with airy mascarpone cream and a heavy dusting of cocoa	https://res.cloudinary.com/du7mvcm09/image/upload/v1773994098/food-ecommerce/products/vssux1wgmqkilqv2xz3t.png	300	999	2026-03-20 08:08:18.977912+00	\N	\N
25	5	Ice Cream	Two scoops of our premium, slow-churned vanilla bean or chocolate silk	https://res.cloudinary.com/du7mvcm09/image/upload/v1773994133/food-ecommerce/products/iq9bptoiflzxilkvi5bc.png	200	999	2026-03-20 08:08:53.998522+00	\N	\N
28	2	Pasta Carbonara	Al dente pasta tossed in a creamy egg sauce with crispy pancetta and cracked black pepper	https://res.cloudinary.com/du7mvcm09/image/upload/v1774002228/food-ecommerce/products/pv2opyn8x25iq2bvo6f5.png	300	999	2026-03-20 10:23:48.858923+00	\N	\N
11	3	Hot Choco	Decadent melted cocoa and steamed milk, topped with a dusting of dark chocolate.	https://res.cloudinary.com/du7mvcm09/image/upload/v1773992698/food-ecommerce/products/ojfxll8ajl4sufovhrli.png	150	149	2026-03-20 07:44:59.498185+00	2026-03-21 05:36:33.644992+00	\N
13	3	Caramel Coffee	Smooth espresso and steamed milk swirled with buttery caramel for a sweet, toasted finish	https://res.cloudinary.com/du7mvcm09/image/upload/v1773992810/food-ecommerce/products/wvxlnarktyndwt66fjtg.png	300	299	2026-03-20 07:46:50.984853+00	2026-03-21 05:36:33.644992+00	\N
19	4	Tofu Salad	Chilled organic tofu cubes over mixed greens with shredded carrots and a ginger-soy vinaigrette	https://res.cloudinary.com/du7mvcm09/image/upload/v1773993448/food-ecommerce/products/sf5jq9pl9huukapff3bv.png	200	998	2026-03-20 07:57:29.580805+00	2026-03-21 05:36:33.644992+00	\N
26	2	Tuna Pasta	A Mediterranean delight with flaked tuna, capers, and garlic in a light olive oil sauce	https://res.cloudinary.com/du7mvcm09/image/upload/v1774002087/food-ecommerce/products/jsggvizakofdts1pg8zs.png	300	998	2026-03-20 10:21:28.41813+00	2026-03-21 05:36:33.644992+00	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.users (user_id, username, password_hash, full_name, contact_number, email_address, role, image) FROM stdin;
1	admin	$2b$12$bwo/1y8.3aNZwqt.JOlgDeJCfLNKl2HHzTSf/7OAc.K1v6UF05wTa	Store Admin	N/A	admin@store.local	admin	\N
2	user	$2b$12$1QwG.BWNJk0KV64FD9Hig.0FlfF7gPrhEyRwnyvtOVHQs5dBs4zwe	User	09679707364	user@gmail.com	buyer	\N
\.


--
-- Name: cart_items_cart_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.cart_items_cart_item_id_seq', 6, true);


--
-- Name: carts_cart_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.carts_cart_id_seq', 2, true);


--
-- Name: categories_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.categories_category_id_seq', 5, true);


--
-- Name: order_items_order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.order_items_order_items_id_seq', 5, true);


--
-- Name: orders_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.orders_order_id_seq', 2, true);


--
-- Name: products_product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.products_product_id_seq', 28, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admin
--

SELECT pg_catalog.setval('public.users_user_id_seq', 2, true);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (cart_item_id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (cart_id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (category_id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (order_items_id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (product_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: ix_cart_items_cart_item_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_cart_items_cart_item_id ON public.cart_items USING btree (cart_item_id);


--
-- Name: ix_carts_cart_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_carts_cart_id ON public.carts USING btree (cart_id);


--
-- Name: ix_categories_category_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_categories_category_id ON public.categories USING btree (category_id);


--
-- Name: ix_categories_category_name; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX ix_categories_category_name ON public.categories USING btree (category_name);


--
-- Name: ix_order_items_order_items_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_order_items_order_items_id ON public.order_items USING btree (order_items_id);


--
-- Name: ix_orders_order_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_orders_order_id ON public.orders USING btree (order_id);


--
-- Name: ix_products_product_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_products_product_id ON public.products USING btree (product_id);


--
-- Name: ix_products_product_name; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_products_product_name ON public.products USING btree (product_name);


--
-- Name: ix_users_email_address; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX ix_users_email_address ON public.users USING btree (email_address);


--
-- Name: ix_users_user_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX ix_users_user_id ON public.users USING btree (user_id);


--
-- Name: ix_users_username; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX ix_users_username ON public.users USING btree (username);


--
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(cart_id);


--
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- Name: carts carts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id);


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- Name: orders orders_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(user_id);


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id);


--
-- PostgreSQL database dump complete
--

\unrestrict vnuFwxmYffBnhuWZ7bVcp3nP5egNMI7NkQIWScK46idmJY6f8ZMJqcIO60XRgf8

