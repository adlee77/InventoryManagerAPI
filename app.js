require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connection = require('./db');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mock user data for demonstration purposes
const users = [
  {
    id: 1,
    username: 'user1',
    password: '$2a$10$fwF.TBxBglCYd2aIELKszuYHCA.C6VCJusb32p6XWI5Slrvy61BmW'
  }
];

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (user == null) {
    console.log('User not found');
    return res.status(400).send('Cannot find user');
  }

  try {
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);

    if (isPasswordValid) {
      const accessToken = jwt.sign({ username: user.username, id: user.id }, process.env.ACCESS_TOKEN_SECRET);
      res.json({ accessToken });
    } else {
      console.log('Invalid password');
      res.send('Not Allowed');
    }
  } catch (error) {
    console.log('Error during login:', error);
    res.status(500).send();
  }
});


// JWT authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // If there is no token, return 401 (Unauthorized)

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // If the token is invalid, return 403 (Forbidden)
    req.user = user;
    next(); // Call next() to pass control to the next middleware
  });
};

// Protect routes with authenticateToken middleware
app.get('/products', authenticateToken, async (req, res) => {
  try {
    const { name, category } = req.query;
    let query = 'SELECT * FROM Products';
    const queryParams = [];

    if (name && category) {
      query += ' WHERE product_name LIKE ? AND category = ?';
      queryParams.push(`%${name}%`, category);
    } else if (name) {
      query += ' WHERE product_name LIKE ?';
      queryParams.push(`%${name}%`);
    } else if (category) {
      query += ' WHERE category = ?';
      queryParams.push(category);
    }

    connection.query(query, queryParams, (err, results) => {
      if (err) {
        throw err;
      }
      res.json(results);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add authentication middleware to the other routes as well
app.post('/products', authenticateToken, async (req, res) => {
  const { product_name, quantity, category } = req.body;
  try {
    connection.query(
      'INSERT INTO Products (product_name, quantity, category) VALUES (?, ?, ?)',
      [product_name, quantity, category],
      (err, results) => {
        if (err) {
          throw err;
        }
        res.status(201).json({ product_id: results.insertId });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/products/:id', authenticateToken, async (req, res) => {
  const { product_name, quantity, category } = req.body;
  const { id } = req.params;

  try {
    const fieldsToUpdate = [];
    const queryParams = [];

    if (product_name !== undefined) {
      fieldsToUpdate.push('product_name = ?');
      queryParams.push(product_name);
    }
    if (quantity !== undefined) {
      fieldsToUpdate.push('quantity = ?');
      queryParams.push(quantity);
    }
    if (category !== undefined) {
      fieldsToUpdate.push('category = ?');
      queryParams.push(category);
    }

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    queryParams.push(id);

    const query = `UPDATE Products SET ${fieldsToUpdate.join(', ')} WHERE product_id = ?`;

    connection.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Error updating product:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Product updated successfully' });
    });
  } catch (error) {
    console.error('Error in PUT /products/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/products/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    connection.query(
      'DELETE FROM Products WHERE product_id = ?',
      [id],
      (err, results) => {
        if (err) {
          throw err;
        }
        res.json({ message: 'Product deleted successfully' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
