const pool = require("./db");
const enableUuidExtension = require("../config/uuidEnable");//uuid enable function

enableUuidExtension();

const createTables=async()=>{

    try {
        
        // Users Table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          email VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          organization VARCHAR(255),
          organization_type VARCHAR(255),
          role VARCHAR(255) DEFAULT 'user',
          status VARCHAR(255) DEFAULT 'pending',
          created_by UUID,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          lastActive VARCHAR(255),
          org_id UUID,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
        );
      `);

      //organization users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS organization_users(
               id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
               name TEXT,
               email TEXT,
               password TEXT,
               role TEXT,
               admin_id UUID,
               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
               organization TEXT,
               organization_type TEXT,
               status TEXT,
               FOREIGN KEY(admin_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
            )
            
            `)
            
  

        console.log("Tables created successfully..");
    } catch (error) {
        console.log("Error creating tables:",error.message);
    }
};

createTables();

module.exports = createTables;