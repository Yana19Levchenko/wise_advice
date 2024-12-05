require('dotenv').config();
const path = require('path');
const nodemailer = require("nodemailer");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AuthModel = require('../models/AuthModel');
const authModel = new AuthModel();

/**
* Клас AuthController відповідає за аутентифікацію та управління користувачами.
*/
class AuthController {
  /**
   * Checks the data entered by the user for correctness.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - Response with an error message if data is invalid.
   */
  async checkData(req, res) {
    const { login, password, confirmPass, email } = req.body;
    if (!login || !password || !confirmPass || !email) {
      return res.status(400).json({ message: 'Fields are required' });
    }
    if (password !== confirmPass) {
      return res.status(400).json({ message: 'Passwords must match. Please check again)'});
    }
    const existEmail = await authModel.findByEmail(email);
    if (existEmail.length > 0) {
      return res.status(400).json({ message: 'This email already exist. Please change it)'});
    }
  }

  /**
   * Registers a new user, hashes the password, and sends a confirmation email.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - Response with a success message for registration.
   */
  async registerNewUser(req, res) {
    const { login, password, confirmPass, email } = req.body;
    await this.checkData(req, res);
    if (res.statusCode != 400) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await authModel.create(login, hashedPassword, email);
      const token = jwt.sign({
        login: login,
        email: email
      }, process.env.SECRET_KEY, { expiresIn: '6h' });
      const link = `${req.protocol}://${req.get('host')}/api/auth/confirm-email/${token}`;
      await authModel.sendEmail(token, email, 'Email Confirmation', `Please confirm your email by clicking the link: ${link}`);
      return res.status(200).json({ message: 'Please check your email to confirm :)' });
    }
  }

  /**
   * Logs in a user, validates credentials, and generates a session token.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - Response with a message about a successful login or an error if one occurs.
   */
  async loginUser(req, res) {
    const { login, password, email } = req.body;
    if (!login || !password || !email) {
      return res.status(400).json({ message: 'Fields are required' });
    }
    const existUser = await authModel.findUser(login, email);
    if (existUser.length <= 0) {
      return res.status(404).json({ message: 'User not found(' });
    }
    const isValidPass = await bcrypt.compare(password, existUser[0].password);
    if (!isValidPass) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    const isConfirmed = await authModel.isConfirmed(email);
    if (isConfirmed[0].is_confirmed) {
      const token = jwt.sign({ userId: existUser[0].id, role: existUser[0].role, login: existUser[0].login }, process.env.SECRET_KEY, { expiresIn: '24h' });
      return res.status(200).json({ message: 'Logged in successfully', token: token });
    }
    else {
      return res.status(500).json({ message: 'Please confirm your email :)' });
    }
  }

  /**
   * Logs out the user.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - Response with a success message for logout or an error if one occurs.
   */
  async logoutUser(req, res) {
    try {
      delete req.headers.authorization;
      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token.' });
    }
  }

  /**
   * Generates a password reset token and sends it to the user's email.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - Response with a message about a successfully sent letter or an error if it occurs.
   */
  async resetPassword(req, res) {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const existUser = await authModel.findByEmail(email);
    if (existUser <= 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const token = jwt.sign({ userId: existUser[0].id }, process.env.SECRET_KEY, { expiresIn: '1h' });
    const url = `${req.protocol}://${req.get('host')}/api/auth/password-reset/${token}`;
    await authModel.sendEmail(token, existUser[0].email, 'Password Reset', `Click on this link to reset your password: ${url}`);
    res.json({ message: 'Password reset link sent to your email' });
  }

  async confirmPassword(req, res) {
    const filePath = path.join(__dirname, '..', 'public', 'new_password.html');
    return res.sendFile(filePath);
  }

  /**
   * Confirms a new password using a password reset token.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - Response with a success message for password confirmation or an error if it occurs.
   */
  async setNewPass(req, res) {
    const { token } = req.params;
    const { newPass } = req.body;
    if (!newPass) {
      return res.status(400).json({ message: 'New password is required' });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY);
    } catch (error) {
       return res.status(401).json({ message: 'Invalid or expired token' });
    }
    const newPassword = await bcrypt.hash(newPass, 10);
    await authModel.save(decoded.userId, newPassword);
    const filePath = path.join(__dirname, '..', 'public', 'password.html');
    return res.sendFile(filePath);
  }

  /**
   * Confirms a user's email address using a confirmation token.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - Response with a success message for email confirmation or an error if it occurs.
   */
  async emailConfirmation(req, res) {
    const token = req.params.token;
    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      const user = await authModel.findUser(decoded.login, decoded.email);
      if (user < 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      await authModel.confirmEmail(decoded.email);
      const filePath = path.join(__dirname, '..', 'public', 'confirm.html');
      return res.sendFile(filePath);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  }

}

module.exports = AuthController;
