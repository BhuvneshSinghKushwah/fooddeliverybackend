const { conn } = require("./db_config");
const { format } = require("sqlstring");

class DbFunctions {
    
  /**
   * @param {string} sql 
   * @param {Array} values 
   * @returns {Promise<Array>} 
   */
  async executeQuery(sql, values = []) {
    const connection = await conn();
    return new Promise((resolve, reject) => {
      connection.query(sql, values, (error, results) => {
        connection.release(); 
        
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * @param {string} tableName 
   * @param {Array} fields 
   * @returns {Promise<Array>} 
   */
  async selectAll(tableName, fields = ["*"]) {
    const sql = `SELECT ?? FROM ??`;
    return this.executeQuery(sql, [fields, tableName]);
  }

  /**
   * @param {string} tableName 
   * @param {Object} conditions 
   * @returns {Promise<Array>}
   */
  async selectWhere(tableName, conditions) {
    const whereClause = format("WHERE ?", [conditions]);
    const sql = `SELECT * FROM ?? ${whereClause}`;
    return this.executeQuery(sql, [tableName]);
  }

  /**
   * @param {string} tableName 
   * @param {Object} data 
   * @returns {Promise<Object>} 
   */
  async insert(tableName, data) {
    const sql = `INSERT INTO ?? SET ?`;
    return this.executeQuery(sql, [tableName, data]);
  }

  /**
   * @param {string} tableName 
   * @param {Object} data 
   * @param {Object} conditions 
   * @returns {Promise<Object>}
   */
  async update(tableName, data, conditions) {
    const sql = `UPDATE ?? SET ? WHERE ?`;
    return this.executeQuery(sql, [tableName, data, conditions]);
  }

  /**
   * @param {string} tableName 
   * @param {Object} conditions 
   * @returns {Promise<Object>} 
   */
  async delete(tableName, conditions) {
    const sql = `DELETE FROM ?? WHERE ?`;
    return this.executeQuery(sql, [tableName, conditions]);
  }

  /**
   * @param {Function} operations 
   * @returns {Promise<*>} 
   */
  async executeTransaction(operations) {
    const connection = await conn();
    try {
      await connection.beginTransaction();
      const result = await operations(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new DbFunctions();
