require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const connection = require('./db');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Get products
app.get('/products', async (req, res) => {
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

// Add a new product
app.post('/products', async (req, res) => {
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

// Update a product
app.put('/products/:id', async (req, res) => {
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
          throw err;
        }
        res.json({ message: 'Product updated successfully' });
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  

// Delete a product
app.delete('/products/:id', async (req, res) => {
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
