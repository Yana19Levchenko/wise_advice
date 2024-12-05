const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const app = express();
app.use(cors());
const http = require('http');
const path = require('path');
const url = require('url');
const multer = require('multer');
const upload = multer({ dest: path.join(__dirname, 'uploads/') });
const db = require('./db');
require('dotenv').config();

// Controllers
const AuthController = require('./controllers/AuthController');
const CategoryController = require('./controllers/CategoryController');
const CommentController = require('./controllers/CommentController');
const PostController = require('./controllers/PostController');
const UserController = require('./controllers/UserController');

// Middleware
const { authenticate, isAdmin } = require('./middleware/auth');

const jsonParser = express.json();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
const server = http.createServer(app);
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads/'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const authController = new AuthController();
const commentController = new CommentController();
const categoryController = new CategoryController();
const postController = new PostController();
const userController = new UserController();

app.post('/api/auth/register', (req, res) => {
  authController.registerNewUser(req, res);
});
app.post('/api/auth/login', (req, res) => {
  authController.loginUser(req, res);
});
app.post('/api/auth/logout', authenticate, (req, res) => {
  authController.logoutUser(req, res);
});
app.post('/api/auth/password-reset', (req, res) => {
  authController.resetPassword(req, res);
});
app.get('/api/auth/password-reset/:token', (req, res) => {
  authController.confirmPassword(req, res);
});
app.post('/api/auth/password-reset/:token', (req, res) => {
  authController.setNewPass(req, res);
});
app.get('/api/auth/confirm-email/:token', (req, res) => {
  authController.emailConfirmation(req, res);
});

app.get('/api/users', authenticate, isAdmin, (req, res) => {
  userController.getAllUsers(req, res);
});
app.get('/api/users/:id', authenticate, (req, res) => {
  userController.getSpecifiedUserData(req, res);
});
app.post('/api/users', authenticate, isAdmin, (req, res) => {
  userController.createNewUser(req, res);
});
app.patch('/api/users/avatar', authenticate, (req, res) => {
  userController.uploadUserAvatar(req, res);
});
app.patch('/api/users/:id/avatar/file', authenticate, upload.single('avatar'),(req, res) => {
  userController.uploadUserAvatarViaFile(req, res);
});
app.patch('/api/users/:id', authenticate, (req, res) => {
  userController.updateUserData(req, res);
});
app.delete('/api/users/:id', authenticate, isAdmin, (req, res) => {
  userController.deleteUser(req, res);
});

app.get('/api/notifications', authenticate, (req, res) => {
  postController.getAllNotifications(req, res);
});
app.post('/api/notifications/:id', authenticate, (req, res) => {
  postController.markAsRead(req, res);
});
app.get('/api/posts', (req, res) => {
  postController.getAllPosts(req, res);
});
app.get('/api/user/posts', authenticate, (req, res) => {
  postController.getUserPosts(req, res);
});
app.get('/api/posts/favorites', authenticate, (req, res) => {
  postController.getFavorites(req, res);
});
app.get('/api/posts/subscriptions', authenticate, (req, res) => {
  postController.getSubscriptions(req, res);
});
app.get('/api/posts/:id', (req, res) => {
  postController.getSpecifiedPostData(req, res);
});
app.get('/api/posts/:id/comments', (req, res) => {
  postController.getSpecifiedPostComments(req, res);
});
app.post('/api/posts/:id/comments', authenticate, (req, res) => {
  postController.createNewComment(req, res);
});
app.get('/api/posts/:id/categories', (req, res) => {
  postController.getSpecifiedPostCategories(req, res);
});
app.get('/api/posts/:id/like', authenticate, (req, res) => {
  postController.getSpecifiedPostLikes(req, res);
});
app.get('/api/posts/:id/dislike', authenticate, (req, res) => {
  postController.getSpecifiedPostDislikes(req, res);
});
app.post('/api/posts', authenticate, (req, res) => {
  postController.createNewPost(req, res);
});
app.post('/api/posts/:id/subscribe', authenticate, (req, res) => {
  postController.subscribeToPost(req, res);
});
app.delete('/api/posts/:id/unsubscribe', authenticate, (req, res) => {
  postController.unsubscribeToPost(req, res);
});
app.patch('/api/posts/:id/lock', authenticate, isAdmin, (req, res) => {
  postController.lockPost(req, res);
});
app.patch('/api/posts/:id/unlock', authenticate, isAdmin, (req, res) => {
  postController.unlockPost(req, res);
});
app.post('/api/posts/:id/favorites', authenticate, (req, res) => {
  postController.addToFavorites(req, res);
});
app.post('/api/posts/:id/like', authenticate, (req, res) => {
  postController.createNewLike(req, res);
});
app.post('/api/posts/:id/dislike', authenticate, (req, res) => {
  postController.createNewDislike(req, res);
});
app.patch('/api/posts/:id', authenticate, (req, res) => {
  postController.updateSpecifiedPost(req, res);
});
app.delete('/api/posts/:id', authenticate, (req, res) => {
  postController.deletePost(req, res);
});
app.delete('/api/posts/:id/favorites', authenticate, (req, res) => {
  postController.deleteFromFavorites(req, res);
});
app.delete('/api/posts/:id/like', authenticate, (req, res) => {
  postController.deleteLike(req, res);
});
app.delete('/api/posts/:id/dislike', authenticate, (req, res) => {
  postController.deleteDislike(req, res);
});

app.get('/api/categories', authenticate, (req, res) => {
  categoryController.getAllCategories(req, res);
});
app.get('/api/categories/:id', authenticate, (req, res) => {
  categoryController.getSpecifiedCategoryData(req, res);
});
app.get('/api/categories/:id/posts', authenticate, (req, res) => {
  categoryController.getPostsByCategory(req, res);
});
app.post('/api/categories', authenticate, isAdmin, (req, res) => {
  categoryController.createNewCategory(req, res);
});
app.patch('/api/categories/:id', authenticate, isAdmin, (req, res) => {
  categoryController.updateSpecifiedCategory(req, res);
});
app.delete('/api/categories/:id', authenticate, isAdmin, (req, res) => {
  categoryController.deleteCategory(req, res);
});

app.get('/api/comments/:id', authenticate, (req, res) => {
  commentController.getSpecifiedCommentData(req, res);
});
app.get('/api/comments/:id/like', authenticate, (req, res) => {
  commentController.getAllLikes(req, res);
});
app.get('/api/comments/:id/dislike', authenticate, (req, res) => {
  commentController.getAllDislikes(req, res);
});
app.get('/api/comments/:id/replies', (req, res) => {
  commentController.getRepliesToComment(req, res);
});
app.post('/api/comments/:id/like', authenticate, (req, res) => {
  commentController.createNewLike(req, res);
});
app.post('/api/comments/:id/dislike', authenticate, (req, res) => {
  commentController.createNewDislike(req, res);
});
app.post('/api/comments/:id/reply', authenticate, (req, res) => {
  commentController.createReply(req, res);
});
app.post('/api/upload', upload.single('image'), (req, res) => {
  const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});
app.patch('/api/comments/:id/lock', authenticate, isAdmin, (req, res) => {
  commentController.lockComment(req, res);
});
app.patch('/api/comments/:id/unlock', authenticate, isAdmin, (req, res) => {
  commentController.unlockComment(req, res);
});
app.patch('/api/posts/:postId/comments/:commentId', authenticate, (req, res) => {
  commentController.chooseBestComment(req, res);
});
app.patch('/api/comments/:id', authenticate, (req, res) => {
  commentController.updateSpecifiedComment(req, res);
});
app.delete('/api/comments/:id', authenticate, (req, res) => {
  commentController.deleteComment(req, res);
});
app.delete('/api/comments/:id/like', authenticate, (req, res) => {
  commentController.deleteLike(req, res);
});
app.delete('/api/comments/:id/dislike', authenticate, (req, res) => {
  commentController.deleteDislike(req, res);
});

app.use('*', (req, res) => {
  return res.status(404).json({ error: 'Not Found' });
});

server.listen(5000, () => {
  console.log('Server is running on port 5000');
});
