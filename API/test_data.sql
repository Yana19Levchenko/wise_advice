INSERT INTO users (login, password, full_name, email, role)
VALUES
('John', '$2y$10$/pBFgVANjnwnB1MK4myf1egzhMGvTnvipcE9uavYeaz4/og9XF4ye', 'John Doe', 'john1@gmail.com', 'admin'),
('Jane', '$2y$10$EvsYZXN9p6YfADX7NrN9t.TtKrIp0UhCeledN6QovQT6dAMMbaNBq', 'Jane Woods', 'jane@gmail.com', 'user'),
('Lily', '$2y$10$TCifmdnwV2luhuhKx6qnNuXd5fBCC7AH1h1eCztRRJLC3IscqPKDm', 'Lily Evans', 'ev1918@gmail.com', 'admin'),
('Ash', '$2y$10$zWefF3gPLRMqnl3j4npkFOXMktRpjaeTTVn22x4HhjUdq2wGdsdSm', 'Ashley Jones', 'jane7593@gmail.com', 'user'),
('Bob', '$2y$10$3WvP0hxa2ahjv0hv7F6qgetuGFMCnjzEao2Bjo6/7n2eclMkI6aaS', 'Bob Smith', 'bob1112@gmail.com', 'user');

INSERT INTO posts (author, title, publish_date, status, content)
VALUES
(1, 'How can I set the default value for an HTML <select> element?', '2022-01-01 12:30:04', 'active', 'I thought that adding a "value" attribute set on the <select> element below would cause the <option> containing my provided "value" to be selected by default. However, this did not work as I had expected. How can I set which <option> element is selected by default?'),
(2, 'Transparent CSS background color', '2022-03-09 13:15:00', 'active', 'I want to make the list menu\'s background disappear by using opacity, without affecting the font. Is it possible with CSS3?'),
(3, 'background-attachment fixed and container width', '2023-05-03 14:40:22', 'active', 'I can\'t understand what "a picture is fixed with regard to the viewport" means and how it\'s connected to the following thing: \nSuppose that we have a html element <div class="background"></div> and some styles\n .background {\n background: url(some-image.jpg) no-repeat fixed;\n height: 500px;\nwidth: 150px;\n}\nIn this case, the background image does not appear. I can\'t understand why and how it\'s related to an idea about viewport.'),
(4, 'static vs dynamic arrays in C', '2021-01-11 18:07:00', 'active', 'What are static and dynamic arrays in C?'),
(5, 'What are good regular expressions?', '2024-08-13 16:00:40', 'active', 'I have worked for 5 years mainly in java desktop applications accessing Oracle databases and I have never used regular expressions. Now I enter Stack Overflow and I see a lot of questions about them; I feel like I missed something. For what do you use regular expressions?'),
(5, '"this" in JS', '2022-01-10 10:12:30', 'active', 'What is "this" in JavaScript?'),
(4, 'CSS: Display Properties differences', '2023-02-08 15:50:00', 'inactive', 'What is the difference between display:block and display:inline?'),
(3, 'div tag', '2020-07-06 12:10:50', 'inactive', 'What is a "div tag"? (Please explain with examples)');

INSERT INTO categories (title, description)
VALUES
('html', 'HTML (HyperText Markup Language) is the markup language for creating web pages and other information to be displayed in a web browser.'),
('javascript', 'JavaScript is a dynamic, object-oriented, prototype programming language. Note that JavaScript is NOT Java.'),
('css', 'CSS (Cascading Style Sheets) is a representation style sheet language used for describing the look and formatting of HTML (HyperText Markup Language), XML (Extensible Markup Language) documents and SVG elements including (but not limited to) colors, layout, fonts, and animations.'),
('c', 'C is a general-purpose computer programming language developed between 1969 and 1973 by Dennis Ritchie at the Bell Telephone Laboratories for use with the UNIX operating system.'),
('arrays', 'An array is an ordered linear data structure consisting of a collection of elements, each identified by one or more indexes.'),
('regex', 'Regular expressions provide a declarative language to match patterns within strings. They are commonly used for string validation, parsing, and transformation.'),
('opacity', 'Opacity is the degree to which a graphical object obscures objects which are rendered behind it.');

INSERT INTO posts_categories (post_id, category_id)
VALUES
(1, 1),
(2, 1),
(2, 3),
(2, 7),
(3, 3),
(4, 4),
(4, 5),
(5, 6),
(6, 2),
(7, 3),
(8, 1);

INSERT INTO comments (author, publish_date, content, is_best)
VALUES
(4, '2022-01-05 12:30:06', 'Set selected="selected" for the option you want to be the default.', 1),
(3, '2022-04-02 15:05:05', 'now you can use rgba in CSS properties like this: .class {\n background: rgba(0,0,0,0.5);\n }\n 0.5 is the transparency, change the values according to your design.', 0),
(2, '2023-05-03 22:03:40', 'Fixed background images use the entire "viewport" or window to contain the image. It is possible your image is contained in such a way that the image is not reaching the area you have setup to show it. I bet if you scaled your browser window down very thin, you would be able to see your image. This is because background images using "fixed" are fixed to the entire viewport, not the element they are defined in. However, they are only viewable in the area they are defined in. Let me know if this helps or if you need further explanation.', 1),
(1, '2021-01-15 17:38:16', 'Static arrays have a fixed size determined at compile time, while dynamic arrays are allocated in memory at runtime using functions such as malloc().', 1),
(2, '2024-08-20 19:45:26', 'Consider an example in Ruby:\n puts "Matched!" unless /\d{3}-\d{4}/.match("555-1234").nil?\n puts "Didn\'t match!" if /\d{3}-\d{4}/.match("Not phone number").nil?\n The "/\d{3}-\d{4}/" is the regular expression, and as you can see it is a VERY concise way of finding a match in a string.', 1),
(3, '2024-08-25 20:33:17', 'Coolest regular expression ever:\n /^1?$|^(11+?)\1+$/\nIt tests if a number is prime. And it works!!', 0),
(1, '2022-01-23 11:38:07', 'this is the keyword that specifies the function\'s execution context. The value of this depends on how the function was called: in object methods, this points to the object to which the method belongs, and in the global context to the global object (in the browser, it is window).', 1);

INSERT INTO likes (author, publish_date, post_id, type)
VALUES
(3, '2022-01-21 12:10:30', 1, 'like'),
(2, '2024-08-22 14:02:03', 5, 'like'),
(1, '2024-09-01 22:34:21', 5, 'like'),
(2, '2023-06-13 10:11:08', 3, 'like'),
(4, '2023-07-06 12:24:30', 3, 'like'),
(1, '2023-05-23 15:19:09', 3, 'like');

INSERT INTO likes (author, publish_date, comment_id, type)
VALUES
(4, '2024-08-21 19:07:20', 5, 'like'),
(4, '2022-04-04 12:00:03', 2, 'like'),
(3, '2024-09-03 17:03:00', 6, 'dislike'),
(2, '2022-01-07 14:40:01', 1, 'like'),
(4, '2022-04-12 12:01:11', 2, 'dislike'),
(1, '2023-05-05 19:50:02', 3, 'dislike');

INSERT INTO posts_comments (post_id, comment_id)
VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 5),
(5, 6),
(6, 7);

INSERT INTO favorites (user, post_id) VALUES (1, 1), (1, 2), (2, 5), (2, 3), (3, 4), (3, 3);
INSERT INTO post_subscriptions (user, post_id) VALUES (1, 3), (1, 2), (4, 1), (4, 3), (3, 2), (3, 3);

INSERT INTO notifications (user_id, post_id, comment_id, message, created_at)
VALUES
(1, 3, 3, 'Post "background-attachment fixed and container width" was commented on by Lily', '2023-05-03 22:03:40'),
(4, 3, 3, 'Post "background-attachment fixed and container width" was commented on by Lily', '2023-05-03 22:03:40'),
(3, 3, 3, 'Post "background-attachment fixed and container width" was commented on by Lily', '2023-05-03 22:03:40'),
(2, 2, null, 'Post "Transparent CSS background color" was changed by Jane', '2022-03-10 13:15:00'),
(3, 2, null, 'Post "Transparent CSS background color" was changed by Jane', '2022-03-10 13:15:00');
