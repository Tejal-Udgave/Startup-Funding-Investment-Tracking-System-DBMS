const mysql = require("mysql2");
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root123",
  database: "SFITS_DBMS_PRJ",
});

db.connect((err) => {
  if (err) {
    console.error("DBERR", err.message);
    process.exit(1);
  }

  db.query("SELECT COUNT(*) AS cnt FROM EQUITY_HISTORY", (e, r) => {
    if (e) {
      console.error("ERR", e.message);
      process.exit(1);
    }
    console.log("EQUITY_HISTORY", r[0].cnt);

    db.query("SELECT COUNT(*) AS cnt FROM FUNDING_ROUND", (e2, r2) => {
      if (e2) {
        console.error("ERR", e2.message);
        process.exit(1);
      }
      console.log("FUNDING_ROUND", r2[0].cnt);

      db.query("SELECT COUNT(*) AS cnt FROM STARTUP", (e3, r3) => {
        if (e3) {
          console.error("ERR", e3.message);
          process.exit(1);
        }
        console.log("STARTUP", r3[0].cnt);

        db.query(
          "SELECT startup_id, startup_name FROM STARTUP LIMIT 5",
          (e4, r4) => {
            if (e4) {
              console.error("ERR", e4.message);
              process.exit(1);
            }
            console.log(JSON.stringify(r4, null, 2));
            process.exit(0);
          },
        );
      });
    });
  });
});
