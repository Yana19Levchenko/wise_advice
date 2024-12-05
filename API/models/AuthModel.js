const nodemailer = require("nodemailer");
const { con } = require('../db');

/**
 * AuthModel class handles authentication-related database operations.
 */
class AuthModel {
  constructor(attributes = {}) {
    Object.assign(this, attributes);
  }

  /**
   * Finds a user by their email address.
   * @param {string} email - The email address of the user.
   * @returns {Object} - The user object if found, otherwise null.
   * @throws {Error} - Throws an error if the database operation fails.
   */
  async findByEmail(email) {
    const select_query = {
      sql: 'SELECT * FROM users WHERE email = ?',
      values: [email]
    };

    const result = await con.promise().query(select_query);
    return result[0];
  }

  /**
   * Finds a user by their login and email address.
   * @param {string} login - The login of the user.
   * @param {string} email - The email address of the user.
   * @returns {Object} - The user object if found, otherwise null.
   * @throws {Error} - Throws an error if the database operation fails.
   */
  async findUser(login, email) {
    const select_query = {
      sql: 'SELECT * FROM users WHERE login = ? AND email = ?',
      values: [login, email]
    };

    const result = await con.promise().query(select_query);
    return result[0];
  }

  /**
   * Sends an email using the configured SMTP transporter.
   * @param {string} token - The token to include in the email (e.g., for password reset).
   * @param {string} email - The recipient's email address.
   * @param {string} title - The subject of the email.
   * @param {string} text - The body text of the email.
   * @returns {Promise<void>} - A promise that resolves when the email is sent.
   * @throws {Error} - Throws an error if the email sending fails.
   */
  async sendEmail(token, email, title, text) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      }
    });

    async function main() {
      const info = await transporter.sendMail({
        from: 'Usof',
        to: email,
        subject: title,
        text: text,
      });
    }

    main();
  }

  /**
   * Creates a new user in the database.
   * @param {string} login - The login of the new user.
   * @param {string} password - The password of the new user.
   * @param {string} email - The email address of the new user.
   * @returns {Object} - The result of the insert operation, containing the inserted ID and other metadata.
   * @throws {Error} - Throws an error if the database operation fails.
   */
  async create(login, password, email) {
    const insert_query = {
      sql: 'INSERT INTO users (login, password, email) VALUES (?, ?, ?)',
      values: [login, password, email]
    };

    const result = await con.promise().query(insert_query);
    return result[0];
  }

  /**
   * Updates the password of an existing user.
   * @param {number} id - The ID of the user whose password is to be updated.
   * @param {string} pass - The new password for the user.
   * @returns {Object} - The result of the update operation, containing the affected rows.
   * @throws {Error} - Throws an error if the database operation fails.
   */
  async save(id, pass) {
    const update_query = {
      sql: 'UPDATE users SET password = ? WHERE id = ?',
      values: [pass, id]
    };

    const result = await con.promise().query(update_query);
    return result[0];
  }

  /**
   * Checks if a user's email is confirmed.
   * @param {string} email - The email address of the user.
   * @returns {Object} - An object containing the confirmation status (is_confirmed).
   * @throws {Error} - Throws an error if the database operation fails.
   */
  async isConfirmed(email) {
    const select_query = {
      sql: 'SELECT is_confirmed FROM users WHERE email = ?',
      values: [email]
    };

    const result = await con.promise().query(select_query);
    return result[0];
  }

  /**
   * Confirms a user's email address by updating the confirmation status in the database.
   * @param {string} email - The email address of the user to be confirmed.
   * @returns {Object} - The result of the update operation, containing the affected rows.
   * @throws {Error} - Throws an error if the database operation fails.
   */
  async confirmEmail(email) {
    const update_query = {
      sql: 'UPDATE users SET is_confirmed = 1 WHERE email = ?',
      values: [email]
    };

    const result = await con.promise().query(update_query);
    return result[0];
  }

}

module.exports = AuthModel;
