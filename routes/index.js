var express = require('express');
var router = express.Router();

module.exports = (db) => {
  // Select by id
  const getById = (id) => {
    db.get('SELECT * FROM data WHERE id = ?', [id], (err, row) => {
      if (err) {
        throw err;
      }
      return row;
    });
  };
  // Add
  const add = (name, height, weight, birthdate, married) => {
    db.run('INSERT INTO data(name, height, weight, birthdate, married) VALUES(?, ?, ?, ?, ?)', [name, height, weight, birthdate, married], (err) => {
      if (err) {
        throw err;
      }
    });
  };
  // Edit
  const edit = (id, name, height, weight, birthdate, married) => {
    db.run('UPDATE data SET name = ?, height = ?, weight = ?, birthdate = ?, married = ? WHERE id = ?', [name, height, weight, birthdate, married, id], (err) => {
      if (err) {
        throw err;
      }
    });
  };
  // Remove
  const remove = (id) => {
    db.run('DELETE FROM data WHERE id = ?', [id], (err) => {
      if (err) {
        throw err;
      }
    });
  }

  // Routes
  // Index Page
  router.get('/', (req, res, next) => {
    const page = req.query.page || 1; // set default page to 1
    const limit = 5; // set limit of records per page
    const offset = (page - 1) * limit; // set offset
    // extract query parameters
    const { name, height, weight, startdate, lastdate, married, operation } = req.query;
    const searchParams = new URLSearchParams({
      name: name || '',
      height: height || '',
      weight: weight || '',
      startdate: startdate || '',
      lastdate: lastdate || '',
      married: married || '',
      operation: operation || 'OR'
    });

    const conditions = [];
    const params = [];
    let searchParamsString = ``;

    if (name) {
      conditions.push('name LIKE ?');
      params.push(`%${name}%`);
    }
    if (height) {
      conditions.push('height = ?');
      params.push(height);
    }
    if (weight) {
      conditions.push('weight = ?');
      params.push(weight);
    }
    if (startdate || lastdate) {
      try {
        if (startdate && lastdate) {
          conditions.push('birthdate BETWEEN ? AND ?');
          params.push(startdate, lastdate);
        } else if (startdate) {
          conditions.push('birthdate >= ?');
          params.push(startdate);
        } else if (lastdate) {
          conditions.push('birthdate <= ?');
          params.push(lastdate);
        }
      } catch (error) {
        return next(error);
      }
    }
    if (married) {
      conditions.push('married = ?');
      params.push(married);
    }

    // Set the WHERE clause based on the conditions
    let whereClause = conditions.length > 0 ? `WHERE ${conditions.join(` ${operation} `)}` : '';
    // Get total records from the database
    let totalRecords = `SELECT COUNT(*) as total FROM data ${whereClause}`;

    db.get(totalRecords, params, (err, row) => {
      if (err) {
        return next(err);
      }
      const total = row.total;
      const pages = Math.ceil(total / limit);
      let query = `SELECT * FROM data ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`;

      // Get the data from the database
      db.all(query, [...params, limit, offset], (err, rows) => {
        if (err) {
          return next(err);
        }
        searchParamsString = searchParams.toString();

        res.render('index', {
          title: 'BREAD Application',
          data: rows,
          searchParams: Object.fromEntries(searchParams.entries()), // Mengubah URLSearchParams menjadi objek JavaScript biasa
          searchParamsString,
          total,
          page,
          pages
        });
      });
    });
  });
  // Add Page

  // Edit Page

  return router;
};
