const jwt = require('jsonwebtoken');
const PostModel = require('../models/PostModel');
const postModel = new PostModel();
const CommentModel = require('../models/CommentModel');
const commentModel = new CommentModel();

/**
 * CommentController class handles CRUD operations and reactions for comments.
 */
class CommentController {

  /**
   * Retrieves data for a specified comment by its ID.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response containing the specified comment data or an error message if not found.
   */
  async getSpecifiedCommentData(req, res) {
    const id = req.params.id;
    const comment = await commentModel.getAllDataById(id);
    if (comment <= 0) {
      return res.status(404).json({ error: 'Comment not found(' });
    }
    res.json(comment);
  }

  /**
   * Retrieves all likes for a specified comment by its ID.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response containing all likes for the specified comment or an error message if not found.
   */
  async getAllLikes(req, res) {
    const id = req.params.id;
    const comment = await commentModel.getAllDataById(id);
    if (comment <= 0) {
      return res.status(404).json({ error: 'Comment not found(' });
    }
    const likes = await commentModel.getAllReactions(id, "like");
    res.json(likes);
  }

  /**
   * Retrieves all dislikes for a specified comment by its ID.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response containing all dislikes for the specified comment or an error message if not found.
   */
  async getAllDislikes(req, res) {
    const id = req.params.id;
    const comment = await commentModel.getAllDataById(id);
    if (comment <= 0) {
      return res.status(404).json({ error: 'Comment not found(' });
    }
    const dislikes = await commentModel.getAllReactions(id, "dislike");
    res.json(dislikes);
  }

  /**
   * Creates a new like for a specified comment by its ID.
   * The rating of the creator of the comment is also updated and the dislike is removed if this user has created it before.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response with a success message if the like is created or an error message if the comment is not found or already liked.
   */
  async createNewLike(req, res) {
    const id = req.params.id;
    const comment = await commentModel.getAllDataById(id);
    if (comment <= 0) {
      return res.status(404).json({ error: 'Comment not found(' });
    }
    const isLocked = await commentModel.isLocked(id);
    if (isLocked.length > 0) {
      return res.status(403).json({ error: 'You cannot respond to this comment' });
    }
    const userId = req.decoded.userId;
    const likes = await commentModel.getUserReactionToComment(userId, id, "like");
    const dislikes = await commentModel.getUserReactionToComment(userId, id, "dislike");
    if (dislikes.length > 0) {
      await commentModel.updateRating(comment[0].author, null, id, 'create');
      await commentModel.deleteReaction(userId, id, "dislike");
    }
    if (likes.length === 0) {
      await commentModel.createReaction(userId, id, "like");
      await commentModel.updateRating(comment[0].author, null, id, 'create');
      return res.status(200).json({ message: 'Like successfully created' });
    }
    else {
      res.status(403).json({ error: 'You have already liked this comment' });
    }
  }

  /**
   * Creates a new dislike for a specified comment by its ID.
   * The rating of the creator of the comment is also updated and the like is removed if this user has created it before.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response with a success message if the dislike is created or an error message if the comment is not found or already disliked.
   */
  async createNewDislike(req, res) {
    const id = req.params.id;
    const userId = req.decoded.userId;
    const comment = await commentModel.getAllDataById(id);
    if (comment <= 0) {
      return res.status(404).json({ error: 'Comment not found(' });
    }
    const isLocked = await commentModel.isLocked(id);
    if (isLocked.length > 0) {
      return res.status(403).json({ error: 'You cannot respond to this comment' });
    }
    const likes = await commentModel.getUserReactionToComment(userId, id, "like");
    const dislikes = await commentModel.getUserReactionToComment(userId, id, "dislike");
    if (likes.length > 0) {
      await commentModel.updateRating(comment[0].author, id, null, 'delete-one');
      await commentModel.deleteReaction(userId, id, "like");
    }
    if (dislikes.length === 0) {
      const dislike = await commentModel.createReaction(req.decoded.userId, id, "dislike");
      await commentModel.updateRating(comment[0].author, id, null, 'delete-one');
      return res.status(200).json({ message: 'Dislike successfully created' });
    }
    else {
      res.status(403).json({ error: 'You have already disliked this comment' });
    }
  }

  async getRepliesToComment(req, res) {
    const parentId = req.params.id;
    const comments = await commentModel.getReplies(parentId);
    res.json(comments);
  }

  async createReply(req, res) {
    const { content } = req.body;
    const parentId = req.params.id;
    const author = req.decoded.userId;
    const comment = await commentModel.createNewReply(author, content, parentId);
    res.json(comment);
  }

  /**
   * Updates a specified comment by its ID with the provided data. Only the creator of a comment or an administrator can update it.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response containing the updated comment or an error message if the comment is not found or no data is provided.
   */
  async updateSpecifiedComment(req, res) {
    const id = req.params.id;
    const comment = await commentModel.getAllDataById(id);
    if (comment <= 0) {
      return res.status(404).json({ error: 'Comment not found(' });
    }
    const check = await commentModel.checkCreator(req.decoded.userId, id);
    if (check <= 0 && req.decoded.role != "admin") {
      return res.status(403).json({ error: 'Permission denied: You are neither the comment creator nor an admin.' });
    }
    const isLocked = await commentModel.isLocked(id);
    if (isLocked.length > 0 && req.decoded.role != "admin") {
      return res.status(403).json({ error: 'You can not edit this comment' });
    }
    const data = req.body;
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No data found' });
    }
    else {
      let updatedComment;
      if (check.length > 0) {
        updatedComment = await commentModel.update(id, {content: data.content});
      }
      if (req.decoded.role === "admin") {
        updatedComment = await commentModel.update(id, {status: data.status});
      }
      if (!updatedComment) {
        return res.status(404).json({ error: 'Comment not found' });
      }
      res.json(updatedComment);
    }
  }

  /**
   * Chooses the best comment for a specified post. Only the creator of the post can choose the best comment and it can be only one.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response with a success message if the best comment is chosen or an error message if the post or comment is not found.
   */
  async chooseBestComment(req, res) {
    const { postId, commentId } = req.params;
    const post = await postModel.getAllDataById(postId);
    if (post <= 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const comment = await commentModel.getAllDataById(commentId);
    if (comment <= 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    const isCreator = await postModel.checkCreator(req.decoded.userId, postId);
    if (isCreator <= 0) {
      return res.status(403).json({ error: 'Only the author of the post can choose the best comment' });
    }
    try {
      const curBest = await commentModel.getBestCommentId(postId);
      if (curBest[0].id && curBest[0].id !== commentId) {
        await commentModel.update(curBest[0].id, { is_best: false });
      }
      await commentModel.update(commentId, {is_best: true});
      return res.status(200).json({ message: 'Best comment chosen successfully' });
    } catch (err) {
       return res.status(500).json({ error: 'Error while choosing the best comment' });
    }
  }

  /**
   * Locks a specified comment by its ID.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response containing information about the updated comment or an error message if the comment is not found or already locked.
   */
  async lockComment(req, res) {
    const id = req.params.id;
    const comment = await commentModel.getAllDataById(id);
    if (comment <= 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    const isLocked = await commentModel.isLocked(id);
    if (isLocked.length > 0) {
      return res.status(403).json({ error: 'You can not lock comment twice!' });
    }
    const updatedComment = await commentModel.toggleLock(id, 1);
    res.json(updatedComment);
  }

  /**
   * Unlocks a specified comment by its ID.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response containing information about the updated comment
   * or an error message if the comment is not found or already unlocked.
   */
  async unlockComment(req, res) {
    const id = req.params.id;
    const comment = await commentModel.getAllDataById(id);
    if (comment <= 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    const isLocked = await commentModel.isLocked(id);
    if (isLocked.length <= 0) {
      return res.status(403).json({ error: 'This comment has already been unlocked!' });
    }
    const updatedComment = await commentModel.toggleLock(id, 0);
    res.json(updatedComment);
  }

  /**
   * Deletes a specified comment by its ID. Only the creator of the comment or the admin can delete it.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response with a success message if the comment is deleted or an error message if the comment is not found or permission is denied.
   */
  async deleteComment(req, res) {
    const id = req.params.id;
    const comment = await commentModel.getAllDataById(id);
    if (comment <= 0) {
      return res.status(404).json({ error: 'Comment not found(' });
    }
    const isCreator = await commentModel.checkCreator(req.decoded.userId, id);
    if (req.decoded.role === "admin" || isCreator.length == 1) {
      await commentModel.updateRating(comment[0].author, null, id, 'delete');
      const deletedComment = await commentModel.deleteById(id);
      if (!deletedComment) {
        return res.status(404).json({ error: 'Comment not found' });
      }
      res.json({ message: 'Comment deleted successfully!' });
    }
    else {
      return res.status(403).json({ error: 'You cannot delete this comment' });
    }
  }

  /**
   * Deletes a like for a specified comment by its ID.
   * The rating of the creator of the comment is also updated.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response with a success message if the like is deleted
   * or an error message if the comment is not found or the like is not found.
   */
  async deleteLike(req, res) {
    const id = req.params.id;
    const comment = await commentModel.getAllDataById(id);
    if (comment <= 0) {
      return res.status(404).json({ error: 'Comment not found(' });
    }
    const isLocked = await commentModel.isLocked(id);
    if (isLocked.length > 0) {
      return res.status(403).json({ error: 'You cannot respond to this comment' });
    }
    const likes = await commentModel.getUserReactionToComment(req.decoded.userId, id, "like");
    if (likes.length > 0) {
      await commentModel.updateRating(comment[0].author, id, null, 'delete-one');
      const deletedLike = await commentModel.deleteReaction(req.decoded.userId, id, "like");
      if (!deletedLike) {
        return res.status(404).json({ error: 'Like not found' });
      }
      res.json({ message: 'Like deleted successfully' });
    }
    else {
      return res.status(403).json({ error: 'You cannot remove like from this comment' });
    }
  }

  /**
   * Deletes a dislike for a specified comment by its ID.
   * The rating of the creator of the comment is also updated.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response with a success message if the dislike is deleted
   * or an error message if the comment is not found or the dislike is not found.
   */
  async deleteDislike(req, res) {
    const id = req.params.id;
    const comment = await commentModel.getAllDataById(id);
    if (comment <= 0) {
      return res.status(404).json({ error: 'Comment not found(' });
    }
    const isLocked = await commentModel.isLocked(id);
    if (isLocked.length > 0) {
      return res.status(403).json({ error: 'You cannot respond to this comment' });
    }
    const dislikes = await commentModel.getUserReactionToComment(req.decoded.userId, id, "dislike");
    if (dislikes.length > 0) {
      await commentModel.updateRating(comment[0].author, id, null, 'create');
      const deletedDislike = await commentModel.deleteReaction(req.decoded.userId, id, "dislike");
      if (!deletedDislike) {
        return res.status(404).json({ error: 'Dislike not found' });
      }
      res.json({ message: 'Dislike deleted successfully' });
    }
    else {
      return res.status(403).json({ error: 'You cannot remove dislike from this comment' });
    }
  }
}

module.exports = CommentController;
