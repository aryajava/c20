const { log } = require("debug/src/browser");
var express = require("express");
var router = express.Router();

module.exports = (db) => {
  // Select by id
  const getById = (id, callback) => {
    db.get("SELECT * FROM data WHERE id = ?", [id], (err, row) => {
      if (err) {
        callback(err);
      }
      if (!row) {
        callback(new Error("No record found"));
      }
      callback(null, row);
    });
  };
  // Add
  const add = (name, height, weight, birthdate, married, callback) => {
    db.run("INSERT INTO data(name, height, weight, birthdate, married) VALUES(?, ?, ?, ?, ?)", [name, height, weight, birthdate, married], (err) => {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  };

  // Edit
  const edit = (id, name, height, weight, birthdate, married, callback) => {
    db.run("UPDATE data SET name = ?, height = ?, weight = ?, birthdate = ?, married = ? WHERE id = ?", [name, height, weight, birthdate, married, id], (err) => {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  };

  // Remove
  const remove = (id, callback) => {
    db.run("DELETE FROM data WHERE id = ?", [id], (err) => {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  };

  // Routes
  // Index Page
  router.get("/", (req, res, next) => {
    const page = req.query.page || 1; // set default page to 1
    const limit = 5; // set limit of records per page
    const offset = (page - 1) * limit; // set offset
    // extract query parameters
    const { name, height, weight, startdate, lastdate, married, operation } = req.query;

    const conditions = [];
    const params = [];

    if (name) {
      conditions.push("name LIKE '%' || ? || '%'");
      params.push(name);
    }
    if (height) {
      conditions.push("height = ?");
      params.push(height);
    }
    if (weight) {
      conditions.push("weight = ?");
      params.push(weight);
    }
    if (startdate && lastdate) {
      conditions.push("birthdate BETWEEN ? AND ?");
      params.push(startdate, lastdate);
    } else if (startdate) {
      conditions.push("birthdate >= ?");
      params.push(startdate);
    } else if (lastdate) {
      conditions.push("birthdate <= ?");
      params.push(lastdate);
    }
    if (married) {
      conditions.push("married = ?");
      params.push(married);
    }

    // Set the WHERE clause based on the conditions
    let whereClause = conditions.length > 0 ? `WHERE ${conditions.join(` ${operation} `)}` : "";
    // Get total records from the database
    let totalRecords = `SELECT COUNT(*) as total FROM data ${whereClause}`;

    db.get(totalRecords, params, (err, row) => {
      if (err) {
        return next(err);
      }
      const total = row.total;
      const pages = Math.ceil(total / limit);
      let query = `SELECT * FROM data ${whereClause} ORDER BY id ASC LIMIT ? OFFSET ?`;

      // Get the data from the database
      db.all(query, [...params, limit, offset], (err, rows) => {
        if (err) {
          return next(err);
        }

        res.render("index", {
          title: "SQLite BREAD (Browse, Read, Edit, Add, Delete) and Pagination",
          data: rows,
          searchParams: req.query,
          total,
          page,
          pages,
        });
      });
    });
  });

  // Add
  // Add Form
  router.get("/add", (req, res, next) => {
    res.render("add", { title: "Adding Data" });
  });
  // Add Save
  router.post("/add", (req, res, next) => {
    const { name, height, weight, birthdate, married } = req.body;
    add(name, height, weight, birthdate, married, (err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });

  // Edit
  // Edit Form
  router.get("/edit/:id", (req, res, next) => {
    const id = req.params.id;
    getById(id, (err, data) => {
      if (err) {
        return next(err);
      }
      res.render("edit", { title: "Updating Data", data });
    });
  });
  // Edit Save
  router.post("/edit/:id", (req, res, next) => {
    const id = req.params.id;
    const { name, height, weight, birthdate, married } = req.body;
    edit(id, name, height, weight, birthdate, married, (err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });
  // Remove
  router.post("/remove/:id", (req, res, next) => {
    const id = req.params.id;
    remove(id, (err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  });

  return router;
};
