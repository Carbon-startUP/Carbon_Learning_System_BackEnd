import { pool } from "../../config/database.js";
import argon2 from "argon2";


const insert_first_admin = async () => {
  const username = "admin";
  const password_hash = await argon2.hash("93ad49a51dce1286bbb3280c54c1aefdaba6db3c357ecbb8b0e3290bb11e11f9");
  const first_name = "Admin";
  const last_name = "User";
  console.log(`Inserting first admin user: ${username} with password hash: ${password_hash}`);
  const query = `
    INSERT INTO users (username, password_hash, first_name, last_name)
    VALUES ($1, $2, $3, $4)
  `;

  await pool.query(query, [ username, password_hash, first_name, last_name]);
}

insert_first_admin();