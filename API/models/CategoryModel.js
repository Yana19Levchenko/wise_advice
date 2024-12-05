const { con } = require('../db');
const BaseModel = require('./BaseModel');

/**
 * CategoryModel class handles database operations related to categories.
 * @extends BaseModel
 */
class CategoryModel extends BaseModel {
  constructor(attributes) {
    super(attributes);
    this.table = "categories";
  }

  /**
   * Retrieves all posts associated with a specified category by its ID.
   * @param {number} id - The ID of the category.
   * @returns {Array} - An array of posts associated with the specified category.
   * @throws {Error} - Throws an error if the database operation fails.
   */
  async getPostsByCategory(id) {
    const select_query = {
      sql: 'SELECT * FROM posts JOIN posts_categories ON posts.id = posts_categories.post_id WHERE category_id = ?',
      values: [id]
    };

    const result = await con.promise().query(select_query);
    return result[0];
  }

  /**
   * Creates a new category in the database with the provided title.
   * @param {string} title - The title of the category.
   * @returns {Object} - The result of the insert operation, containing the inserted ID and other metadata.
   * @throws {Error} - Throws an error if the database operation fails.
   */
  async createCategory(title, desc) {
    const insert_query = {
      sql: 'INSERT INTO categories (title, description) VALUES (?, ?)',
      values: [title, desc]
    };

    const result = await con.promise().query(insert_query);
    return result[0];
  }

}

module.exports = CategoryModel;
