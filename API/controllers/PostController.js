const jwt = require('jsonwebtoken');
const PostModel = require('../models/PostModel');
const postModel = new PostModel();

/**
 * PostController class handles the operations related to posts, including
 * creating, updating, deleting, and retrieving posts and their associated data.
 */
class PostController {

  /**
   * Sets the filter for retrieving posts based on query parameters.
   * @param {Object} query - The query parameters from the request.
   * @returns {Object} - The filter object containing categories, dateInterval, and status.
   */
  setFilter(query) {
    const filter = {};
    if (query.categories) {
        filter.categories = query.categories;
    }
    if (query.dateInterval) {
        filter.dateInterval = query.dateInterval;
    }
    if (query.status) {
        filter.status = query.status;
    }
    return filter;
  }

  /**
   * Retrieves all posts with optional filtering, sorting and pagination.
   * @param {Object} req - The request object containing query parameters and headers.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response with the posts or an error message.
   */
  async getAllPosts(req, res) {
    const pageSize = 3;
    const pageNumber = req.query.page || 1;
    let posts;
    const sort = req.query.sort;
    const filter = this.setFilter(req.query);
    try {
      if (req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (decoded.role === 'admin') {
          posts = await postModel.getPosts(pageSize, pageNumber, sort, filter);
        }
        else {
          posts = await postModel.getActivePosts(decoded.userId, pageSize, pageNumber, sort, filter);
        }
      }
      else {
        posts = await postModel.getActivePosts(null, pageSize, pageNumber, sort, filter);
      }
      res.json(posts);
    } catch (err) {
      res.status(401).json({ message: 'Invalid token.' });
    }
  }

  async getUserPosts(req, res) {
    const pageSize = 3;
    const pageNumber = req.query.page || 1;
    const sort = req.query.sort;
    const filter = this.setFilter(req.query);
    const posts = await postModel.getPostsByUser(req.decoded.userId, pageSize, pageNumber, sort, filter);
    res.json(posts);
  }

  /**
   * Retrieves the favorite posts of the authenticated user.
   * @param {Object} req - The request object containing user information.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response with the favorite posts.
   */
  async getFavorites(req, res) {
    const pageSize = 3;
    const pageNumber = req.query.page || 1;
    const sort = req.query.sort;
    const filter = this.setFilter(req.query);
    const posts = await postModel.getFavorites(req.decoded.userId, pageSize, pageNumber, sort, filter);
    res.json(posts);
  }

  /**
   * Retrieves all subscriptions of the authenticated user.
   * @param {Object} req - The request object containing user information.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response with the subscriptions.
   */
  async getSubscriptions(req, res) {
    const pageSize = 3;
    const pageNumber = req.query.page || 1;
    const sort = req.query.sort;
    const filter = this.setFilter(req.query);
    const subs = await postModel.getAllSubscriptions(req.decoded.userId, pageSize, pageNumber, sort, filter);
    res.json(subs);
  }

  /**
   * Retrieves all notifications for the authenticated user.
   * @param {Object} req - The request object containing user information.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response with the notifications.
   */
  async getAllNotifications(req, res) {
    const pageSize = 4;
    const pageNumber = req.query.page || 1;
    const notif = await postModel.getNotifications(req.decoded.userId, pageSize, pageNumber);
    res.json(notif);
  }

  /**
   * Retrieves data for a specified post by its ID.
   * @param {Object} req - The request object containing the post ID in parameters.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response with the post data or an error message.
   */
  async getSpecifiedPostData(req, res) {
    const id = req.params.id;
    const post = await postModel.getAllDataById(id);
    if (post <= 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const resp = await postModel.getAuthorLoginById(post[0].author);
    post[0].author = resp[0].login;
    res.json(post);
  }

   /**
   * Retrieves comments for a specified post by its ID.
   * @param {Object} req - The request object containing the post ID in parameters.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response with the comments or an error message.
   */
  async getSpecifiedPostComments(req, res) {
    const id = req.params.id;
    const post = await postModel.getAllDataById(id);
    if (post <= 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const comments = await postModel.getCommentsByPostId(id);
    res.json(comments);
  }

  /**
   * Marks a notification as read for the authenticated user.
   * @param {Object} req - The request object containing the notification ID in parameters.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response with info about the updated notification.
   */
  async markAsRead(req, res) {
    const id = req.params.id;
    const notif = await postModel.markNotificationAsRead(id);
    res.json(notif);
  }

  /**
   * Creates a new comment on a specified post.
   * @param {Object} req - The request object containing the post ID in parameters and comment content in the body.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response with info about the new comment or an error message.
   */
  async createNewComment(req, res) {
    const id = req.params.id;
    const post = await postModel.getAllDataById(id);
    if (post <= 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const isLocked = await postModel.isLocked(id);
    if (isLocked.length > 0) {
      return res.status(403).json({ error: 'You can not edit this post' });
    }
    const userId = req.decoded.userId;
    const content = req.body.content;
    if (!content) {
      return res.status(400).json({ error: 'No content found' });
    }
    else {
      const newComment = await postModel.createComment(userId, id, content);
      await postModel.sendNotificationAboutComment(userId, newComment, post[0]);
      res.json(newComment);
    }
  }

  /**
   * Retrieves categories associated with a specified post by its ID.
   * @param {Object} req - The request object containing the post ID in parameters.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response with the categories or an error message.
   */
  async getSpecifiedPostCategories(req, res) {
    const id = req.params.id;
    const post = await postModel.getAllDataById(id);
    if (post <= 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const categories = await postModel.getCategoriesByPostId(id);
    res.json(categories);
  }

  /**
   * Retrieves likes associated with a specified post by its ID.
   * @param {Object} req - The request object containing the post ID in parameters.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response with the likes or an error message.
   */
  async getSpecifiedPostLikes(req, res) {
    const id = req.params.id;
    const post = await postModel.getAllDataById(id);
    if (post <= 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const likes = await postModel.getReactionsByPostId(id, "like");
    res.json(likes);
  }

  /**
   * Retrieves dislikes associated with a specified post by its ID.
   * @param {Object} req - The request object containing the post ID in parameters.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response with the dislikes or an error message.
   */
  async getSpecifiedPostDislikes(req, res) {
    const id = req.params.id;
    const post = await postModel.getAllDataById(id);
    if (post <= 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const dislikes = await postModel.getReactionsByPostId(id, "dislike");
    res.json(dislikes);
  }

  /**
   * Subscribes the authenticated user to a specified post.
   * @param {Object} req - The request object containing the post ID in parameters.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response confirming the subscription or an error message.
   */
  async subscribeToPost(req, res) {
    const postId = req.params.id;
    const post = await postModel.getAllDataById(postId);
    if (post <= 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const sub = await postModel.subscribeToPost(postId, req.decoded.userId);
    if (!sub) {
      return res.status(404).json({ error: 'Failed to subscribe' });
    }
    res.json({ message: 'Subscribed to post successfully' });
  }

  /**
   * Unsubscribes the authenticated user from a specified post.
   * @param {Object} req - The request object containing the post ID in parameters.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response confirming the unsubscription or an error message.
   */
  async unsubscribeToPost(req, res) {
    const postId = req.params.id;
    const post = await postModel.getAllDataById(postId);
    if (post <= 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const sub = await postModel.unsubscribeToPost(postId, req.decoded.userId);
    if (!sub) {
      return res.status(404).json({ error: 'Failed to unsubscribe' });
    }
    res.json({ message: 'Unsubscribed to post successfully' });
  }

  /**
   * Creates a new post with the provided title, content, and categories.
   * @param {Object} req - The request object containing post details in the body.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response with info about the newly created post or an error message.
   */
  async createNewPost(req, res) {
    const {title, content, categories} = req.body;
    if (!title || !content || !categories) {
      return res.status(400).json({ message: 'Fields are required' });
    }
    const newPost = await postModel.createPost(req.decoded.userId, title, content, categories);
    res.json(newPost);
  }

  /**
   * Adds a specified post to the authenticated user's favorites.
   * @param {Object} req - The request object containing the post ID in parameters.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response with info the new favorite or an error message.
   */
  async addToFavorites(req, res) {
    const id = req.params.id;
    const post = await postModel.getAllDataById(id);
    if (post <= 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const newFavorite = await postModel.addToFavorites(req.decoded.userId, id);
    res.json(newFavorite);
  }

  /**
   * Removes a specified post from the authenticated user's favorites.
   * @param {Object} req - The request object containing the post ID in parameters.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response confirming the removal or an error message.
   */
  async deleteFromFavorites(req, res) {
    const id = req.params.id;
    const post = await postModel.getAllDataById(id);
    if (post <= 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const rmFavorite = await postModel.deleteFromFavorites(req.decoded.userId, id);
    if (!rmFavorite) {
      return res.status(404).json({ error: 'Failed to delete post' });
    }
    res.json({ message: 'Post removed from favorites' });
  }

  /**
   * Creates a new like for a specified post by the authenticated user.
   * The rating of the creator of the post is also updated and the dislike is removed if this user has created it before.
   * @param {Object} req - The request object containing the post ID in parameters.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response confirming the like creation or an error message.
   */
  async createNewLike(req, res) {
    const id = req.params.id;
    const post = await postModel.getAllDataById(id);
    if (post <= 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const isLocked = await postModel.isLocked(id);
    if (isLocked.length > 0) {
      return res.status(403).json({ error: 'You cannot respond to this post' });
    }
    const userId = req.decoded.userId;
    let likes = await postModel.getUserReactionToPost(userId, id, "like");
    let dislikes = await postModel.getUserReactionToPost(userId, id, "dislike");
    if (dislikes.length > 0) {
      await postModel.updateRating(post[0].author, id, null, 'create');
      await postModel.deleteReaction(userId, id, "dislike");
    }
    if (likes.length === 0) {
      const newLike = await postModel.createReaction(userId, id, "like");
      await postModel.updateRating(post[0].author, id, null, 'create');
      return res.status(200).json({ message: 'Like created successfully' });
    }
    else {
      res.status(403).json({ error: 'You have already liked this post' });
    }
  }

  /**
   * Creates a new dislike for a specified post by the authenticated user.
   * The rating of the creator of the post is also updated and the like is removed if this user has created it before.
   * @param {Object} req - The request object containing the post ID in parameters.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response confirming the dislike creation or an error message.
   */
  async createNewDislike(req, res) {
    const id = req.params.id;
    const post = await postModel.getAllDataById(id);
    if (post <= 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const isLocked = await postModel.isLocked(id);
    if (isLocked.length > 0) {
      return res.status(403).json({ error: 'You cannot respond to this post' });
    }
    const userId = req.decoded.userId;
    const likes = await postModel.getUserReactionToPost(userId, id, "like");
    const dislikes = await postModel.getUserReactionToPost(userId, id, "dislike");
    if (likes.length > 0) {
      await postModel.updateRating(post[0].author, id, null, 'delete-one');
      await postModel.deleteReaction(userId, id, "like");
    }
    if (dislikes.length === 0) {
      const newDislike = await postModel.createReaction(userId, id, "dislike");
      await postModel.updateRating(post[0].author, id, null, 'delete-one');
      return res.status(200).json({ message: 'Dislike created successfully' });
    }
    else {
      res.status(403).json({ error: 'You have already disliked this post' });
    }
  }

  /**
   * Updates a specified post with new data.
   * @param {Object} req - The request object containing the post ID in parameters and update data in the body.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response with info about the updated post or an error message.
   */
  async updateSpecifiedPost(req, res) {
    const id = req.params.id;
    const post = await postModel.getAllDataById(id);
    if (post <= 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const check = await postModel.checkCreator(req.decoded.userId, id);
    if (check <= 0 && req.decoded.role != "admin") {
      return res.status(403).json({ error: 'You did not create this post' });
    }
    const isLocked = await postModel.isLocked(id);
    if (isLocked.length > 0) {
      return res.status(403).json({ error: 'You can not edit this post' });
    }
    const data = req.body;
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No data found' });
    }
    let updates = {};
    if (req.decoded.role == "admin") {
      if (data.status !== undefined) {
        updates.status = data.status;
      }
    }
    if (check.length > 0) {
      if (data.title !== undefined) {
        updates.title = data.title;
      }
      if (data.content !== undefined) {
        updates.content = data.content;
      }
    }
    if (Object.keys(updates).length !== 0) {
      let updatedPost = await postModel.update(id, updates);
    }
    if (data.category) {
      await postModel.deletePostCategories(id);
      let categories = data.category.split(",");
      for (const category of categories) {
        await postModel.createPostCategory(id, category);
      }
    }
    await postModel.sendNotificationAboutPost(req.decoded.userId, post[0]);
    return res.status(200).json({ message: 'Post updated successfully' });
  }

  /**
   * Locks a specified post, preventing further comments or reactions.
   * @param {Object} req - The request object containing the post ID in parameters.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response with info about the updated post or an error message.
   */
  async lockPost(req, res) {
    const id = req.params.id;
    const post = await postModel.getAllDataById(id);
    if (post <= 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const isLocked = await postModel.isLocked(id);
    if (isLocked.length > 0) {
      return res.status(403).json({ error: 'You can not lock post twice!' });
    }
    const updatedPost = await postModel.toggleLock(id, 1);
    res.json(updatedPost);
  }

  /**
   * Unlocks a specified post, allowing comments and reactions again.
   * @param {Object} req - The request object containing the post ID in parameters.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response with info about the updated post or an error message.
   */
  async unlockPost(req, res) {
    const id = req.params.id;
    const post = await postModel.getAllDataById(id);
    if (post <= 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const isLocked = await postModel.isLocked(id);
    if (isLocked.length <= 0) {
      return res.status(403).json({ error: 'This post has already been unlocked!' });
    }
    const updatedPost = await postModel.toggleLock(id, 0);
    res.json(updatedPost);
  }

  /**
   * Deletes a specified post by its ID.
   * The rating of the creator of the post is also updated.
   * @param {Object} req - The request object containing the post ID in parameters.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response confirming the deletion or an error message.
   */
  async deletePost(req, res) {
    const id = req.params.id;
    const post = await postModel.getAllDataById(id);
    if (post <= 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const isCreator = await postModel.checkCreator(req.decoded.userId, id);
    if (req.decoded.role === "admin" || isCreator.length == 1) {
      await postModel.updateRating(post[0].author, id, null, 'delete');
      const deletedPost = await postModel.deleteById(id);
      if (!deletedPost) {
        return res.status(404).json({ error: 'Post not found' });
      }
      res.json({ message: 'Post deleted successfully' });
    }
    else {
      return res.status(403).json({ error: 'You cannot delete this post' });
    }
  }

  /**
   * Deletes a like from a specified post by the authenticated user.
   * The rating of the creator of the post is also updated.
   * @param {Object} req - The request object containing the post ID in parameters.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response confirming the like deletion or an error message.
   */
  async deleteLike(req, res) {
    const id = req.params.id;
    const post = await postModel.getAllDataById(id);
    if (post <= 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const isLocked = await postModel.isLocked(id);
    if (isLocked.length > 0) {
      return res.status(403).json({ error: 'You cannot respond to this post' });
    }
    const likes = await postModel.getUserReactionToPost(req.decoded.userId, id, "like");
    if (likes.length > 0) {
      await postModel.updateRating(post[0].author, id, null, 'delete-one');
      const deletedLike = await postModel.deleteReaction(req.decoded.userId, id, "like");
      if (!deletedLike) {
        return res.status(404).json({ error: 'Like not found' });
      }
      res.status(200).json({ message: 'Like deleted successfully' });
    }
    else {
      return res.status(403).json({ error: 'You cannot remove like from this post' });
    }
  }

  /**
   * Deletes a dislike from a specified post by the authenticated user.
   * The rating of the creator of the post is also updated.
   * @param {Object} req - The request object containing the post ID in parameters.
   * @param {Object} res - The response object used to send the response.
   * @returns {Promise<void>} - Sends a JSON response confirming the dislike deletion or an error message.
   */
  async deleteDislike(req, res) {
    const id = req.params.id;
    const post = await postModel.getAllDataById(id);
    if (post <= 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const isLocked = await postModel.isLocked(id);
    if (isLocked.length > 0) {
      return res.status(403).json({ error: 'You cannot respond to this post' });
    }
    const dislikes = await postModel.getUserReactionToPost(req.decoded.userId, id, "dislike");
    if (dislikes.length > 0) {
      await postModel.updateRating(post[0].author, id, null, 'create');
      const deletedDislike = await postModel.deleteReaction(req.decoded.userId, id, "dislike");
      if (!deletedDislike) {
        return res.status(404).json({ error: 'Dislike not found' });
      }
      res.status(200).json({ message: 'Dislike deleted successfully' });
    }
    else {
      return res.status(403).json({ error: 'You cannot remove dislike from this post' });
    }
  }
}

module.exports = PostController;
