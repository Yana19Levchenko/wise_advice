const CategoryModel = require('../models/CategoryModel');
const categoryModel = new CategoryModel();

/**
 * CategoryController class handles CRUD operations for categories.
 */
class CategoryController {
  /**
   * Retrieves all categories from the database.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response containing all categories.
   */
  async getAllCategories(req, res) {
    const categories = await categoryModel.getAllData();
    res.json(categories);
  }

  /**
   * Retrieves data for a specified category by its ID.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response containing the specified category data or an error message if not found.
   */
  async getSpecifiedCategoryData(req, res) {
    const id = req.params.id;
    const category = await categoryModel.getAllDataById(id);
    if (category <= 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  }

  /**
   * Retrieves posts associated with a specified category by its ID.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response containing posts for the specified category or an error message if the category is not found.
   */
  async getPostsByCategory(req, res) {
    const id = req.params.id;
    const category = await categoryModel.getAllDataById(id);
    if (category <= 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    const posts = await categoryModel.getPostsByCategory(id);
    res.json(posts);
  }

  /**
   * Creates a new category with the provided title.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response containing information about the newly created category or an error message if the title is not provided.
   */
  async createNewCategory(req, res) {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title not found' });
    }
    const newCategory = await categoryModel.createCategory(title, description || '');
    res.json(newCategory);
  }

  /**
   * Updates a specified category by its ID with the provided data.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response containing information about the updated category or an error message if the category is not found or no data is provided.
   */
  async updateSpecifiedCategory(req, res) {
    const id = req.params.id;
    const category = await categoryModel.getAllDataById(id);
    if (category <= 0) {
      return res.status(404).json({ error: 'Category not found(' });
    }
    const data = req.body;
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No data found' });
    }
    else {
      const updatedCategory = await categoryModel.update(id, data);
      if (!updatedCategory) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json(updatedCategory);
    }
  }

  /**
   * Deletes a specified category by its ID.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object} - JSON response with a success message if the category is deleted or an error message if the category is not found.
   */
  async deleteCategory(req, res) {
    const id = req.params.id;
    const user = await categoryModel.getAllDataById(id);
    if (user.length == 1) {
      const deletedCategory = await categoryModel.deleteById(id);
      if (!deletedCategory) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json({ message: 'Category deleted successfully' });
    }
    else {
      return res.status(404).json({ error: 'Category not found' });
    }
  }
}

module.exports = CategoryController;
