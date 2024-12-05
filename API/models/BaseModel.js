const { con } = require('../db');

/**
 * BaseModel class provides common database operations for models.
 */
class BaseModel {
  constructor(attributes = {}) {
    Object.assign(this, attributes);
  }

  /**
   * Retrieves all data from the associated table.
   * @returns {Array} - An array of all records in the table.
   * @throws {Error} - Throws an error if the database operation fails.
   */
  async getAllData() {
    const select_query = {
      sql: 'SELECT * FROM ??',
      values: [this.table]
    };

    const result = await con.promise().query(select_query);
    return result[0];
  }

  /**
   * Retrieves a record by its ID from the associated table.
   * @param {number} id - The ID of the record to retrieve.
   * @returns {Object} - The record object if found, otherwise null.
   * @throws {Error} - Throws an error if the database operation fails.
   */
  async getAllDataById(id) {
    const select_query = {
      sql: 'SELECT * FROM ?? WHERE id = ?',
      values: [this.table, id]
    };

    const result = await con.promise().query(select_query);
    return result[0];
  }

  /**
   * Deletes a record by its ID from the associated table.
   * @param {number} id - The ID of the record to delete.
   * @returns {Object} - The result of the delete operation, containing the affected rows.
   * @throws {Error} - Throws an error if the database operation fails.
   */
  async deleteById(id) {
    const delete_query = {
      sql: 'DELETE FROM ?? WHERE id = ?',
      values: [this.table, id]
    };

    const result = await con.promise().query(delete_query);
    return result[0];
  }

  /**
   * Updates a record in the associated table.
   * @param {number} id - The ID of the record to update.
   * @param {Object} data - An object containing the fields to update.
   * @returns {Object} - The result of the update operation, containing the affected rows.
   * @throws {Error} - Throws an error if the database operation fails.
   */
  async update(id, data) {
    const update_query = {
      sql: 'UPDATE ?? SET ? WHERE id = ?',
      values: [this.table, data, id]
    };

    const result = await con.promise().query(update_query);
    return result[0];
  }

  /**
   * Checks if a record is locked by its ID.
   * @param {number} id - The ID of the record to check.
   * @returns {Object} - The record object if found and locked, otherwise null.
   * @throws {Error} - Throws an error if the database operation fails.
   */
  async isLocked(id) {
    const select_query = {
      sql: 'SELECT * FROM ?? WHERE id = ? AND locked = 1',
      values: [this.table, id]
    };

    const result = await con.promise().query(select_query);
    return result[0];

  }

  /**
   * Checks if the specified user is the creator of the record.
   * @param {number} userId - The ID of the user to check.
   * @param {number} id - The ID of the record to check against.
   * @returns {Object} - The record object if found and the user is the creator, otherwise null.
   * @throws {Error} - Throws an error if the database operation fails.
   */
  async checkCreator(userId, id) {
    const select_query = {
      sql: 'SELECT * FROM ?? WHERE id = ? AND author = ?',
      values: [this.table, id, userId]
    };

    const result = await con.promise().query(select_query);
    return result[0];
  }

  /**
   * Toggles the lock status of a record by its ID.
   * @param {number} id - The ID of the record to update.
   * @param {boolean} status - The new lock status (true for locked, false for unlocked).
   * @returns {Object} - The result of the update operation, containing the affected rows.
   * @throws {Error} - Throws an error if the database operation fails.
   */
  async toggleLock(id, status) {
    const update_query = {
      sql: 'UPDATE ?? SET locked = ? WHERE id = ?',
      values: [this.table, status, id]
    };

    const result = await con.promise().query(update_query);
    return result[0];
  }

  /**
   * Updates the rating of a user based on likes and dislikes for posts or comments.
   * @param {number} userId - The ID of the user whose rating is to be updated.
   * @param {number|null} postId - The ID of the post associated with the rating (null if not applicable).
   * @param {number|null} commentId - The ID of the comment associated with the rating (null if not applicable).
   * @param {string} status - The action to perform: "create" to add a like, "delete-one" to remove a single like,
   * or "delete" to subtract the number of likes and add the number of dislikes to the rating.
   * @returns {Object} - The result of the update operation, containing the affected rows.
   * @throws {Error} - Throws an error if the database operation fails.
   */
  async updateRating(userId, postId, commentId, status) {
    let likes_count;
    if (status === "create") {
      likes_count = 1;
    }
    else if (status === "delete-one") {
      likes_count = -1;
    }
    else if (status === "delete") {
      if (commentId == null) {
        const select_post_query = {
          sql: 'SELECT COUNT(*) AS likes_count FROM likes WHERE post_id = ? AND type = "like"',
          values: [postId]
        };
        let result = await con.promise().query(select_post_query);
        likes_count = -1 * result[0][0].likes_count;

        const select_post_query_dis = {
          sql: 'SELECT COUNT(*) AS dislikes_count FROM likes WHERE post_id = ? AND type = "dislike"',
          values: [postId]
        };
        result = await con.promise().query(select_post_query_dis);
        likes_count = likes_count + result[0][0].dislikes_count;
      }
      else if (postId == null) {
        const select_com_query = {
          sql: 'SELECT COUNT(*) AS likes_count FROM likes WHERE comment_id = ? AND type = "like"',
          values: [commentId]
        };
        let result = await con.promise().query(select_com_query);
        likes_count = -1 * result[0][0].likes_count;

        const select_com_query_dis = {
          sql: 'SELECT COUNT(*) AS dislikes_count FROM likes WHERE comment_id = ? AND type = "dislike"',
          values: [commentId]
        };
        result = await con.promise().query(select_com_query_dis);
        likes_count = likes_count + result[0][0].dislikes_count;
      }

    }
    const update_query = {
      sql: 'UPDATE users SET rating = rating + ? WHERE id = ?',
      values: [likes_count, userId]
    };

    const result = await con.promise().query(update_query);
    return result[0];
  }

}

module.exports = BaseModel;
