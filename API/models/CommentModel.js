const { con } = require('../db');
const BaseModel = require('./BaseModel');

/**
 * CommentModel class handles database operations related to comments and their reactions.
 * @extends BaseModel
 */
class CommentModel extends BaseModel {
  constructor(attributes) {
    super(attributes);
    this.table = "comments";
  }

  /**
   * Retrieves all reactions for a specified comment by its ID and type of reaction.
   * @param {number} id - The ID of the comment.
   * @param {string} type - The type of reaction ('like' or 'dislike').
   * @returns {Array} - An array of reactions associated with the specified comment.
   * @throws {Error} - Throws an error if the database operation fails.
   */
  async getAllReactions(id, type) {
    const select_query = {
      sql: 'SELECT * FROM likes WHERE comment_id = ? AND type = ?',
      values: [id, type]
    };

    const result = await con.promise().query(select_query);
    return result[0];
  }

  /**
   * Retrieves a user's reaction to a specific comment.
   * @param {number} userId - The ID of the user.
   * @param {number} id - The ID of the comment.
   * @param {string} type - The type of reaction ('like' or 'dislike').
   * @returns {Object} - The user's reaction to the specified comment or null if no reaction exists.
   * @throws {Error} - Throws an error if the database operation fails.
   */
  async getUserReactionToComment(userId, id, type) {
    const select_query = {
      sql: 'SELECT * FROM likes WHERE comment_id = ? AND author = ? AND type = ?',
      values: [id, userId, type]
    };

    const result = await con.promise().query(select_query);
    return result[0];
  }

  /**
   * Creates a new reaction for a specified comment.
   * @param {number} author - The ID of the user reacting to the comment.
   * @param {number} id - The ID of the comment.
   * @param {string} type - The type of reaction ('like' or 'dislike').
   * @returns {Object} - The result of the insert operation, containing the inserted ID and other metadata.
   * @throws {Error} - Throws an error if the database operation fails.
   */
  async createReaction(author, id, type) {
    const insert_query = {
      sql: 'INSERT INTO likes (author, comment_id, type) VALUES (?, ?, ?)',
      values: [author, id, type]
    };

    const result = await con.promise().query(insert_query);
    return result[0];
  }

  /**
   * Deletes a user's reaction to a specific comment.
   * @param {number} author - The ID of the user whose reaction is to be deleted.
   * @param {number} id - The ID of the comment.
   * @param {string} type - The type of reaction ('like' or 'dislike').
   * @returns {Object} - The result of the delete operation, containing the affected rows.
   * @throws {Error} - Throws an error if the database operation fails.
   */
  async deleteReaction(author, id, type) {
    const delete_query = {
      sql: 'DELETE FROM likes WHERE author = ? AND comment_id = ? AND type = ?',
      values: [author, id, type]
    };

    const result = await con.promise().query(delete_query);
    return result[0];
  }

  async getReplies(parentId) {
    const select_query = {
      sql: 'SELECT comments.id AS id, comments.content, comments.publish_date, users.login AS author FROM comments JOIN users ON comments.author = users.id WHERE parent_id = ?',
      values: [parentId]
    };

    const result = await con.promise().query(select_query);
    return result[0];
  }

  async createNewReply(author, content, parentId) {
    const insert_query = {
      sql: 'INSERT INTO comments (author, content, parent_id) VALUES (?, ?, ?)',
      values: [author, content, parentId]
    };

    const result = await con.promise().query(insert_query);
    return result[0];
  }

  /**
   * Retrieves the ID of the best comment for a specified post.
   * @param {number} postId - The ID of the post.
   * @returns {Object} - The ID of the best comment associated with the specified post or null if no best comment exists.
   * @throws {Error} - Throws an error if the database operation fails.
   */
  async getBestCommentId(postId) {
    const select_query = {
      sql: 'SELECT id FROM comments ' +
           'JOIN posts_comments ON comments.id = posts_comments.comment_id' +
           ' WHERE posts_comments.post_id = ? AND comments.is_best = 1',
      values: [postId]
    };

    const result = await con.promise().query(select_query);
    return result[0];
  }

}

module.exports = CommentModel;
