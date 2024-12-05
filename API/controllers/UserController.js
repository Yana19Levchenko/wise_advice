const bcrypt = require('bcrypt');
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const fs_prom = require('fs').promises;
const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');
const AuthController = require('../controllers/AuthController');
const authController = new AuthController();
const AuthModel = require('../models/AuthModel');
const authModel = new AuthModel();
const userModel = new UserModel();

/**
 * UserController class handles CRUD operations for users.
 */
class UserController {

  /**
   * Retrieves all users from the database.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response containing an array of all users.
   */
  async getAllUsers(req, res) {
    const users = await userModel.getAllData();
    res.json(users);
  }

  /**
   * Retrieves data for a specified user by their ID.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response containing the specified user data or an error message if not found.
   */
  async getSpecifiedUserData(req, res) {
    const id = req.params.id;
    const user = await userModel.getAllDataById(id);
    if (user <= 0) {
      return res.status(404).json({ error: 'User not found(' });
    }
    res.json(user);
  }

  /**
   * Creates a new user with the provided data.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response with a success message if the user is created or an error message if the data is invalid.
   */
  async createNewUser(req, res) {
    const {login, password, confirmPass, email, role} = req.body;
    await authController.checkData(req, res);
    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }
    if (res.statusCode != 400) {
      const hashedPass = await bcrypt.hash(password, 10);
      try {
        await userModel.createUser(login, hashedPass, email, role);
        const token = jwt.sign({
          login: login,
          email: email
        }, process.env.SECRET_KEY, { expiresIn: '6h' });
        const link = `${req.protocol}://${req.get('host')}/api/auth/confirm-email/${token}`;
        await authModel.sendEmail(token, email, 'Email Confirmation', `Please confirm your email by clicking the link: ${link}`);
        return res.status(201).json({ message: 'User created successfully!' });
      } catch (err) {
         return res.status(500).json({ message: 'Error creating user. Please check your data and try again.' });
      }
    }
  }

  /**
   * Uploads a new avatar for the user and removes the old one if it is not the default one.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response with a success message if the avatar is uploaded or an error message if the user is not found or the upload fails.
   */
  async uploadUserAvatar(req, res) {
    const id = req.decoded.userId;
    const avatar = req.body.avatar;
    if (!avatar) {
      return res.status(404).json({ error: 'Avatar not found' });
    }
    const user = await userModel.getAllDataById(req.decoded.userId);
    if (user[0].profile_picture !== 'default-avatar.png') {
      const oldAvatarPath = path.join(__dirname, '../uploads/', user[0].profile_picture);
      fs.unlink(oldAvatarPath, (err) => {
        if (err) {
          console.error('Error deleting old avatar:', err);
        }
      });
    }

    const currentTime = new Date().getTime();
    const fileExtension = path.extname(avatar);
    const newFileName = currentTime + fileExtension;
    const targetPath = path.join(__dirname, '../uploads/', newFileName);

    fs.copyFile(avatar, targetPath, (err) => {
      if (err) {
        return res.status(500).json({ message: 'An error occurred while downloading the file' });
      }
    });
    const updatedUser = await userModel.update(id, { profile_picture: newFileName });
    if (updatedUser <= 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ message: 'File uploaded successfully', file: newFileName });
  }

  async uploadUserAvatarViaFile(req, res) {
    const id = req.params.id;
    const avatar = req.file;
    if (!avatar) {
        return res.status(404).json({ error: 'Avatar not found' });
    }

    const user = await userModel.getAllDataById(id);
    if (user[0].profile_picture !== 'default-avatar.png') {
        const oldAvatarPath = path.join(__dirname, '../uploads', user[0].profile_picture);
        fs.unlink(oldAvatarPath, (err) => {
            if (err) {
                console.error('Error deleting old avatar:', err);
            }
        });
    }

    const currentTime = new Date().getTime();
    const fileExtension = path.extname(avatar.originalname);
    const newFileName = currentTime + fileExtension;
    const targetPath = path.join(__dirname, '../uploads', newFileName);

    try {
        await fs_prom.access(avatar.path);
        await fs_prom.rename(avatar.path, targetPath);
        const updatedUser = await userModel.update(id, { profile_picture: newFileName });
        if (updatedUser <= 0) {
            return res.status(404).json({ error: 'User  not found' });
        }
        return;
    } catch (err) {
        console.error('Error moving the file:', err);
        return res.status(500).json({ message: 'An error occurred while moving the file' });
    }
   }

  /**
   * Updates the specified user's data.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response containing info about the updated user data or an error message if the user is not found.
   */
  async updateUserData(req, res) {
    const id = req.params.id;
    const data = req.body;
    if (data.password) {
      const hashedPass = await bcrypt.hash(data.password, 10);
      data.password = hashedPass;
    }
    const updatedUser = await userModel.update(id, data);
    if (updatedUser <= 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(updatedUser);
  }

  /**
   * Deletes a specified user by their ID.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response with a success message if the user is deleted or an error message if the user is not found.
   */
  async deleteUser(req, res) {
    const id = req.params.id;
    const user = await userModel.getAllDataById(id);
    if (user.length == 1) {
      const deleted = await userModel.deleteById(id);
      if (deleted <= 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'User deleted successfully' });
    }
    else {
      return res.status(404).json({ error: 'User not found' });
    }
  }
}

module.exports = UserController;
