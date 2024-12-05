const { con } = require('../db');
const BaseModel = require('./BaseModel');

/**
 * UserModel class handles database operations related to users.
 * @extends BaseModel
 */
class UserModel extends BaseModel {
  constructor(attributes) {
    super(attributes);
    this.table = "users";
  }

  /**
   * Creates a new user in the database with the provided login, password, email, and role.
   * @param {string} login - The login of the user.
   * @param {string} password - The hashed password of the user.
   * @param {string} email - The email of the user.
   * @param {string} role - The role of the user (admin or user).
   * @returns {Object} - The result of the insert operation, containing the inserted ID and other metadata.
   * @throws {Error} - Throws an error if the database operation fails.
   */
  async createUser(login, password, email, role) {
    const insert_query = {
      sql: 'INSERT INTO users (login, password, email, role) VALUES (?, ?, ?, ?)',
      values: [login, password, email, role]
    };

    const result = await con.promise().query(insert_query);
    return result[0];
  }

}

module.exports = UserModel;
