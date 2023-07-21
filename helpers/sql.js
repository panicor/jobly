const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

/*

sqlForPartialUpdate is a helper function that allows for the creation of the SQL SET clause for an UPDATE.

@param dataToUpdate {Object} Key-value pairs that contains the data to update
@param jsToSql {Object} Uses a map to create database column names from JS data

@returns {Object} {sqlSetCols, dataToUpdate}

 @example {firstName: 'Cash', age: 26} =>
    { setCols: '"first_name"=$1, "age"=$2',
      values: ['Cash', 26] }

 */


function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
