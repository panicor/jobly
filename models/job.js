"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
  static async create(data) {
    let res = await db.query(
      `INSERT INTO jobs (title, salary, equity, company_handle)
        VALUES ($1, $2, $3, $4)
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [data.title, data.salary, data.equity, data.companyHandle]
    );

    let job = res.rows[0];
    return job;
  }

  static async findAll({ minSalary, hasEquity, title } = {}) {
    let query = `SELECT j.id, j.title, j.salary, j.equity, j.company_handle AS "companyHandle", c.name AS "companyName"
          FROM jobs AS j LEFT JOIN companies AS c ON c.handle = j.company_handle`;

    let whereExp = [];
    let queryVals = [];

    if (minSalary !== undefined) {
      queryVals.push(minSalary);
      whereExp.push(`salary >= $${queryVals.length}`);
    }

    if (hasEquity === true) {
      whereExp.push(`equity > 0`);
    }

    if (title !== undefined) {
      queryVals.push(`%${title}%`);
      whereExp.push(`title ILIKE $${queryVals.length}`);
    }

    if (whereExp.length > 0) {
      query += " WHERE " + whereExp.join(" AND ");
    }

    query += " ORDER BY title";
    let jobsRes = await db.query(query, queryVals);
    return jobsRes.rows;
  }

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [id]
    );

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    const companiesRes = await db.query(
      `SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [job.companyHandle]
    );

    delete job.companyHandle;

    job.company = companiesRes.rows[0];

    return job;
  }

  static async update(id, data) {
    let { setCols, values } = sqlForPartialUpdate(data, {});

    let idVarIdx = "$" + (values.length + 1);

    let sqlQuery = `UPDATE jobs
                        SET ${setCols}
                        WHERE id = ${idVarIdx}
                        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;

    let res = await db.query(sqlQuery, [...values, id]);
    let job = res.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  static async remove(id) {
    let res = await db.query(
      `DELETE 
        FROM jobs 
        WHERE id = $1 
        RETURNING id`,
      [id]
    );

    let job = res.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;
