const { con } = require('../db');
const BaseModel = require('./BaseModel');

/**
 * Represents the Post model, extending the BaseModel.
 * This class handles database interactions related to posts, including
 * creating, updating, deleting, and retrieving posts, as well as managing
 * likes, comments, subscriptions, and notifications.
 */
class PostModel extends BaseModel {
  constructor(attributes) {
    super(attributes);
    this.table = "posts";
  }

  /**
   * Generates the base SQL query for retrieving posts with likes count.
   * @returns {Object} - An object containing the SQL query string and values.
   */
  generateBaseQuery() {
    return {
      sql: 'SELECT posts.*, users.login AS author, COUNT(likes.id) AS likes_count ' + //new
           'FROM posts ' +
           'LEFT JOIN likes ON likes.post_id = posts.id AND likes.type = "like" ' +
           'LEFT JOIN posts_categories ON posts.id = posts_categories.post_id ' +
           'LEFT JOIN categories ON categories.id = posts_categories.category_id ' +
           'LEFT JOIN users ON users.id = posts.author ', //new
      values: []
    };
  }

  /**
   * Applies filters to the SQL query based on the provided filter object.
   * @param {Object} select_query - The SQL query object to modify.
   * @param {Object} filter - The filter criteria to apply.
   */
  applyFilters(select_query, filter) {
    if (filter) {
      if (filter.categories) {
        const categories = [filter.categories.split(',')];
        select_query.sql += select_query.sql.includes('WHERE') ? ' AND' : ' WHERE';
        select_query.sql += ` categories.title IN ?`;
        select_query.values.push(categories);
      }

      if (filter.dateInterval) {
        const [startDate, endDate] = filter.dateInterval.split(',');
        select_query.sql += select_query.sql.includes('WHERE') ? ' AND' : ' WHERE';
        select_query.sql += ' posts.publish_date BETWEEN ? AND ?';
        select_query.values.push(startDate, endDate);
      }

      if (filter.status) {
        select_query.sql += select_query.sql.includes('WHERE') ? ' AND' : ' WHERE';
        select_query.sql += ' status = ?';
        select_query.values.push(filter.status);
      }
      select_query.sql += ' GROUP BY posts.id';
    }
  }

  /**
   * Applies sorting to the SQL query based on the provided sort criteria.
   * @param {Object} select_query - The SQL query object to modify.
   * @param {string} sort - The sorting criteria ('likes' or 'date').
   */
  applySorting(select_query, sort) {
    if (sort) {
      switch (sort) {
        case 'likes' :
          select_query.sql += ' ORDER BY likes_count DESC';
          break;
        case 'date' :
          select_query.sql += ' ORDER BY publish_date DESC';
          break;
        default:
          select_query.sql += ' ORDER BY likes_count DESC';
      }
    }
    else {
      select_query.sql += ' ORDER BY likes_count DESC';
    }
  }

  /**
   * Retrieves posts with pagination, sorting, and filtering options.
   * @param {number} pageSize - The number of posts per page.
   * @param {number} pageNumber - The current page number.
   * @param {string} sort - The sorting criteria.
   * @param {Object} filter - The filter criteria.
   * @returns {Promise<Array>} - A promise that resolves to an array of posts.
   */
  async getPosts(pageSize, pageNumber, sort, filter) {
    const offset = (pageNumber - 1) * pageSize;
    const select_query = this.generateBaseQuery();

    this.applyFilters(select_query, filter);
    this.applySorting(select_query, sort);

    select_query.sql += ' LIMIT ? OFFSET ?';
    select_query.values.push(pageSize, offset);
    const countQuery = {
      sql: select_query.sql.replace(' LIMIT ? OFFSET ?', ''),
      values: select_query.values.slice(0, -2)
    }
    const result = await con.promise().query(select_query);

    //new
    const countResult = await con.promise().query(countQuery);

    return {
      posts: result[0],
      total: countResult[0].length
    };
  }

  async getPostsByUser(id, pageSize, pageNumber, sort, filter) {
    const offset = (pageNumber - 1) * pageSize;
    const select_query = this.generateBaseQuery();
    select_query.sql += ' WHERE posts.author = ? ';
    select_query.values.push(id);
    this.applyFilters(select_query, filter);
    this.applySorting(select_query, sort);

    select_query.sql += ' LIMIT ? OFFSET ?';
    select_query.values.push(pageSize, offset);
    const countQuery = {
      sql: select_query.sql.replace(' LIMIT ? OFFSET ?', ''),
      values: select_query.values.slice(0, -2)
    }
    const result = await con.promise().query(select_query);
    const countResult = await con.promise().query(countQuery);
    return {
      posts: result[0],
      total: countResult[0].length
    };
  }

  /**
   * Retrieves active posts for a specific user with pagination, sorting, and filtering options.
   * @param {number} id - The user ID.
   * @param {number} pageSize - The number of posts per page.
   * @param {number} pageNumber - The current page number.
   * @param {string} sort - The sorting criteria.
   * @param {Object} filter - The filter criteria.
   * @returns {Promise<Array>} - A promise that resolves to an array of active posts and user's inactive posts.
   */
  async getActivePosts(id, pageSize, pageNumber, sort, filter) {
    const offset = (pageNumber - 1) * pageSize;
    const select_query = this.generateBaseQuery();
    if (id) {
      select_query.sql += ' WHERE (posts.status = "active" OR (posts.status = "inactive" AND posts.author = ?)) ';
      select_query.values.push(id);
    }
    else {
      select_query.sql += ' WHERE status = "active" ';
    }
    this.applyFilters(select_query, filter);
    this.applySorting(select_query, sort);

    select_query.sql += ' LIMIT ? OFFSET ?';
    select_query.values.push(pageSize, offset);
    const countQuery = {
      sql: select_query.sql.replace(' LIMIT ? OFFSET ?', ''),
      values: select_query.values.slice(0, -2)
    }
    const result = await con.promise().query(select_query);

    //new
    const countResult = await con.promise().query(countQuery);
    return {
      posts: result[0],
      total: countResult[0].length
    };

  }

  /**
   * Retrieves all subscriptions for a specific user.
   * @param {number} userId - The user ID.
   * @returns {Promise<Array>} - A promise that resolves to an array of subscribed posts.
   */
  async getAllSubscriptions(userId, pageSize, pageNumber, sort, filter) {
    const offset = (pageNumber - 1) * pageSize;
    const select_query = this.generateBaseQuery();
    select_query.sql += 'JOIN post_subscriptions ON posts.id = post_subscriptions.post_id ' +
      'WHERE post_subscriptions.user = ?';
    select_query.values.push(userId);
    this.applyFilters(select_query, filter);
    this.applySorting(select_query, sort);

    select_query.sql += ' LIMIT ? OFFSET ?';
    select_query.values.push(pageSize, offset);
    const countQuery = {
      sql: select_query.sql.replace(' LIMIT ? OFFSET ?', ''),
      values: select_query.values.slice(0, -2)
    }

    const result = await con.promise().query(select_query);
    const countResult = await con.promise().query(countQuery);
    return {
      posts: result[0],
      total: countResult[0].length
    };
  }

  /**
   * Retrieves notifications for a specific user.
   * @param {number} userId - The user ID.
   * @returns {Promise<Array>} - A promise that resolves to an array of notifications.
   */
  async getNotifications(userId, pageSize, pageNumber) {
    const offset = (pageNumber - 1) * pageSize;
    const select_query = {
      sql: 'SELECT * FROM notifications ' +
      'WHERE user_id = ? AND (is_read = 0 OR (is_read = 1 AND read_at <= DATE_ADD(created_at, INTERVAL 7 DAY))) ' +
      ' LIMIT ? OFFSET ?',
      values: [userId, pageSize, offset]
    };

    const countQuery = {
      sql: select_query.sql.replace(' LIMIT ? OFFSET ?', ''),
      values: select_query.values.slice(0, -2)
    }

    const result = await con.promise().query(select_query);
    const countResult = await con.promise().query(countQuery);
    return {
      messages: result[0],
      total: countResult[0].length
    };
  }

  /**
   * Retrieves subscribers for a specific post.
   * @param {number} postId - The post ID.
   * @returns {Promise<Array>} - A promise that resolves to an array of subscribers.
   */
  async getPostSubscribers(postId) {
    const select_query = {
      sql: 'SELECT posts.* FROM posts ' +
      'JOIN post_subscriptions ON posts.id = post_subscriptions.post_id ' +
      'WHERE post_subscriptions.post_id = ? ORDER BY posts.publish_date DESC',
      values: [postId]
    };

    const result = await con.promise().query(select_query);
    return result[0];
  }

  /**
   * Retrieves a user's reaction to a specific post.
   * @param {number} userId - The user ID.
   * @param {number} id - The post ID.
   * @param {string} type - The type of reaction ('like' or 'dislike').
   * @returns {Promise<Array>} - A promise that resolves to an array of reactions.
   */
  async getUserReactionToPost(userId, id, type) {
    const select_query = {
      sql: 'SELECT * FROM likes WHERE post_id = ? AND author = ? AND type = ?',
      values: [id, userId, type]
    };

    const result = await con.promise().query(select_query);
    return result[0];
  }

  /**
   * Retrieves favorite posts for a specific user with pagination, sorting, and filtering options.
   * @param {number} id - The user ID.
   * @param {number} pageSize - The number of posts per page.
   * @param {number} pageNumber - The current page number.
   * @param {string} sort - The sorting criteria.
   * @param {Object} filter - The filter criteria.
   * @returns {Promise<Array>} - A promise that resolves to an array of favorite posts.
   */
  async getFavorites(id, pageSize, pageNumber, sort, filter) {
    const offset = (pageNumber - 1) * pageSize;
    const select_query = this.generateBaseQuery();
    select_query.sql += ' JOIN favorites ON posts.id = favorites.post_id '
                        + 'WHERE favorites.user = ? AND (posts.status = "active" OR (posts.status = "inactive" AND posts.author = ?)) ';
    select_query.values.push(id, id);

    this.applyFilters(select_query, filter);
    this.applySorting(select_query, sort);

    select_query.sql += ' LIMIT ? OFFSET ?';
    select_query.values.push(pageSize, offset);

    const countQuery = {
      sql: select_query.sql.replace(' LIMIT ? OFFSET ?', ''),
      values: select_query.values.slice(0, -2)
    }
    const result = await con.promise().query(select_query);
    const countResult = await con.promise().query(countQuery);
    return {
      posts: result[0],
      total: countResult[0].length
    };
  }

  /**
   * Marks a notification as read.
   * @param {number} id - The notification ID.
   * @returns {Promise<Object>} - A promise that resolves to the result of the update operation.
   */
  async markNotificationAsRead(id) {
    const update_query = {
      sql: 'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ?',
      values: [id]
    };

    const result = await con.promise().query(update_query);
    return result[0];
  }

  /**
   * Subscribes a user to a specific post.
   * @param {number} postId - The ID of the post to subscribe to.
   * @param {number} userId - The ID of the user subscribing to the post.
   * @returns {Promise<void>} - A promise that resolves when the subscription is created.
   */
  async subscribeToPost(postId, userId) {
    const select_query = {
      sql: 'SELECT * FROM post_subscriptions WHERE user = ? AND post_id = ?',
      values: [userId, postId]
    };

    const [existingSubscription] = await con.promise().query(select_query);
    if (existingSubscription.length > 0) {
      return;
    }

    const insert_query = {
      sql: 'INSERT INTO post_subscriptions (user, post_id) VALUES (?, ?)',
      values: [userId, postId]
    };

    const result = await con.promise().query(insert_query);
    return result[0];
  }

  /**
   * Unsubscribes a user from a specific post.
   * @param {number} postId - The ID of the post to unsubscribe from.
   * @param {number} userId - The ID of the user unsubscribing from the post.
   * @returns {Promise<void>} - A promise that resolves when the subscription is deleted.
   */
  async unsubscribeToPost(postId, userId) {
    const select_query = {
      sql: 'SELECT * FROM post_subscriptions WHERE user = ? AND post_id = ?',
      values: [userId, postId]
    };

    const [existingSubscription] = await con.promise().query(select_query);
    if (existingSubscription.length <= 0) {
      return;
    }

    const delete_query = {
      sql: 'DELETE FROM post_subscriptions WHERE post_id = ? AND user = ?',
      values: [postId, userId]
    };

    const result = await con.promise().query(delete_query);
    return result[0];
  }

  /**
   * Adds a post to the user's favorites.
   * @param {number} userId - The ID of the user adding the post to favorites.
   * @param {number} id - The ID of the post to add to favorites.
   * @returns {Promise<void>} - A promise that resolves when the post is added to favorites.
   */
  async addToFavorites(userId, id) {
    const insert_query = {
      sql: 'INSERT INTO favorites (user, post_id) VALUES (?, ?)',
      values: [userId, id]
    };

    const result = await con.promise().query(insert_query);
    return result[0];
  }

  /**
   * Deletes a post from the user's favorites.
   * @param {number} userId - The ID of the user removing the post from favorites.
   * @param {number} id - The ID of the post to remove from favorites.
   * @returns {Promise<void>} - A promise that resolves when the post is removed from favorites.
   */
  async deleteFromFavorites(userId, id) {
    const delete_query = {
      sql: 'DELETE FROM favorites WHERE post_id = ? AND user = ?',
      values: [id, userId]
    };

    const result = await con.promise().query(delete_query);
    return result[0];
  }

  async getAuthorLoginById(authorId) {
    const select_query = {
      sql: 'SELECT login FROM users WHERE id = ?',
      values: [authorId]
    };
    const result = await con.promise().query(select_query);
    return result[0];
  }

  /**
   * Retrieves comments associated with a specific post.
   * @param {number} id - The ID of the post to retrieve comments for.
   * @returns {Promise<Array>} - A promise that resolves to an array of comments.
   */
  async getCommentsByPostId(id) {
    const select_query = {
      sql: 'SELECT *, users.login AS author FROM comments JOIN posts_comments ON comments.id = posts_comments.comment_id' +
           ' JOIN users ON comments.author = users.id WHERE post_id = ?',
      values: [id]
    };

    const result = await con.promise().query(select_query);
    return result[0];
  }

  /**
   * Creates a new comment for a specific post.
   * @param {number} author - The ID of the author creating the comment.
   * @param {number} id - The ID of the post to comment on.
   * @param {string} content - The content of the comment.
   * @returns {Promise<Object>} - A promise that resolves to the result of the comment creation.
   */
  async createComment(author, id, content) {
    const insert_comment_query = {
      sql: 'INSERT INTO comments (author, content) VALUES (?, ?)',
      values: [author, content]
    };

    const result = await con.promise().query(insert_comment_query);
    const commentId = result[0].insertId;

    const insert_post_comment_query = {
      sql: 'INSERT INTO posts_comments (post_id, comment_id) VALUES (?, ?)',
      values: [id, commentId]
    };

    await con.promise().query(insert_post_comment_query);
    return result[0];
  }

  /**
   * Retrieves categories associated with a specific post.
   * @param {number} id - The ID of the post to retrieve categories for.
   * @returns {Promise<Array>} - A promise that resolves to an array of categories.
   */
  async getCategoriesByPostId(id) {
    const select_query = {
      sql: 'SELECT * FROM categories JOIN posts_categories ON categories.id = posts_categories.category_id WHERE post_id = ?',
      values: [id]
    };

    const result = await con.promise().query(select_query);
    return result[0];
  }

  /**
   * Retrieves reactions (likes/dislikes) associated with a specific post.
   * @param {number} id - The ID of the post to retrieve reactions for.
   * @param {string} type - The type of reaction ('like' or 'dislike').
   * @returns {Promise<Array>} - A promise that resolves to an array of reactions.
   */
  async getReactionsByPostId(id, type) {
    const select_query = {
      sql: 'SELECT * FROM likes WHERE post_id = ? AND type = ?',
      values: [id, type]
    };

    const result = await con.promise().query(select_query);
    return result[0];
  }

  /**
   * Creates a new post with the specified author, title, content, and categories.
   * @param {number} author - The ID of the author creating the post.
   * @param {string} title - The title of the post.
   * @param {string} content - The content of the post.
   * @param {string} categories - A comma-separated string of category titles.
   * @returns {Promise<Object>} - A promise that resolves to the result of the post creation.
   */
  async createPost(author,title, content, categories) {
    const insert_query = {
      sql: 'INSERT INTO posts (author, title, content) VALUES (?, ?, ?)',
      values: [author, title, content]
    };

    const result = await con.promise().query(insert_query);
    const postId = result[0].insertId;

    for (const category of categories.split(",")) {
      await this.createPostCategory(postId, category);
    }

    return result[0];
  }

  /**
   * Creates a new category for a specific post.
   * @param {number} postId - The ID of the post to associate the category with.
   * @param {string} category - The title of the category to create.
   * @returns {Promise<void>} - A promise that resolves when the category is created.
   */
  async createPostCategory(postId, category) {
    const select_query = {
      sql: 'SELECT id FROM categories WHERE title = ?',
      values: [category]
    };
    const result = await con.promise().query(select_query);

    const insert_query = {
      sql: 'INSERT INTO posts_categories (post_id, category_id) VALUES (?, ?)',
      values: [postId, result[0][0].id]
    };

    await con.promise().query(insert_query);
  }

  /**
   * Deletes all categories associated with a specific post.
   * @param {number} postId - The ID of the post whose categories are to be deleted.
   * @returns {Promise<void>} - A promise that resolves when the categories are deleted.
   */
  async deletePostCategories(postId) {
    const delete_query = {
      sql: 'DELETE FROM posts_categories WHERE post_id = ?',
      values: [postId]
    };

    const result = await con.promise().query(delete_query);
    return result[0];
  }

  /**
   * Creates a new reaction (like/dislike) for a specific post.
   * @param {number} author - The ID of the author creating the reaction.
   * @param {number} id - The ID of the post to react to.
   * @param {string} type - The type of reaction ('like' or 'dislike').
   * @returns {Promise<Object>} - A promise that resolves to the result of the reaction creation.
   */
  async createReaction(author, id, type) {
    const insert_query = {
      sql: 'INSERT INTO likes (author, post_id, type) VALUES (?, ?, ?)',
      values: [author, id, type]
    };

    const result = await con.promise().query(insert_query);
    return result[0];
  }

  /**
   * Deletes a reaction (like/dislike) from a specific post.
   * @param {number} author - The ID of the author removing the reaction.
   * @param {number} id - The ID of the post to remove the reaction from.
   * @param {string} type - The type of reaction to remove ('like' or 'dislike').
   * @returns {Promise<void>} - A promise that resolves when the reaction is deleted.
   */
  async deleteReaction(author, id, type) {
    const delete_query = {
      sql: 'DELETE FROM likes WHERE post_id = ? AND author = ? AND type = ?',
      values: [id, author, type]
    };

    const result = await con.promise().query(delete_query);
    return result[0];
  }

  /**
   * Sends a notification to users subscribed to a post when the post is changed.
   * @param {number} userId - The ID of the user who made the changes.
   * @param {Object} newPost - The post object containing the updated post details.
   * @returns {Promise<void>} - A promise that resolves when notifications are sent.
   */
  async sendNotificationAboutPost(userId, newPost) {
    const select_query = {
      sql: 'SELECT user FROM post_subscriptions WHERE post_id = ?',
      values: [newPost.id]
    };

    const subscribedUsers = await con.promise().query(select_query);

    for (const subscriber of subscribedUsers[0]) {
      const insert_query = {
      sql: 'INSERT INTO notifications(user_id, post_id, comment_id, message)' +
      'VALUES(?, ?, NULL,' +
      'CONCAT("Post ", ?, " was changed by ", (SELECT login FROM users WHERE id = ?)));',
      values: [subscriber.user, newPost.id, newPost.title, userId]
    };
    console.log('Insert query:', insert_query);
    const result = await con.promise().query(insert_query);
    console.log('Insert result:', result);
    }
  }

  /**
   * Sends a notification to users subscribed to a post when a new comment is added.
   * @param {number} userId - The ID of the user who made the comment.
   * @param {Object} newComment - The comment object containing the new comment details.
   * @param {Object} post - The post object to which the comment was added.
   * @returns {Promise<void>} - A promise that resolves when notifications are sent.
   */
  async sendNotificationAboutComment(userId, newComment, post) {
    const select_query = {
      sql: 'SELECT user FROM post_subscriptions WHERE post_id = ?',
      values: [post.id]
    };

    const subscribedUsers = await con.promise().query(select_query);

    for (const subscriber of subscribedUsers[0]) {
      const insert_query = {
        sql: 'INSERT INTO notifications(user_id, post_id, comment_id, message)' +
          'VALUES(?, ?, ?,' +
          'CONCAT("Post ", ?, " was commented on by ", (SELECT login FROM users WHERE id = ?)));',
        values: [subscriber.user, post.id, newComment.id, post.title, userId]
      };

      const result = await con.promise().query(insert_query);
    }
  }

}

module.exports = PostModel;
