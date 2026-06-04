// ================= IMPORTS =================
const express = require("express");
const mysql = require("mysql2");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ================= DB =================
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root123",
  database: process.env.DB_NAME || "SFITS_DBMS_PRJ",
  ssl: {
    rejectUnauthorized: false,
  },
});

db.connect((err) => {
  if (err) return console.error(err);
  console.log("MySQL Connected");
  console.log("Checkpoint A");
  function ensureColumn(tableName, columnName, alterSql) {
    db.query(
      `SHOW COLUMNS FROM ${tableName} LIKE ?`,
      [columnName],
      (showErr, showRes) => {
        if (showErr) {
          return console.warn(
            `Unable to inspect ${tableName} columns:`,
            showErr.sqlMessage || showErr.message,
          );
        }

        if (!showRes || showRes.length === 0) {
          db.query(alterSql, (alterErr) => {
            if (alterErr) {
              return console.error(
                `Failed to add ${tableName}.${columnName}:`,
                alterErr.sqlMessage || alterErr.message,
              );
            }
            console.log(`Added missing ${tableName}.${columnName} column`);
          });
        }
      },
    );
  }

  ensureColumn(
    "FOUNDER",
    "founder_email",
    "ALTER TABLE FOUNDER ADD COLUMN founder_email VARCHAR(100) NULL",
  );

  ensureColumn(
    "FOUNDER",
    "user_id",
    "ALTER TABLE FOUNDER ADD COLUMN user_id INT NULL",
  );

  ensureColumn(
    "INVESTOR",
    "user_id",
    "ALTER TABLE INVESTOR ADD COLUMN user_id INT NULL",
  );

  ensureColumn(
    "STARTUP",
    "user_id",
    "ALTER TABLE STARTUP ADD COLUMN user_id INT NULL",
  );
  console.log("Checkpoint B");
  function ensureStartupProfileTable() {
    db.query("SHOW TABLES LIKE 'STARTUP_PROFILE'", (err, result) => {
      if (err) {
        return console.warn(
          "Unable to inspect STARTUP_PROFILE table:",
          err.sqlMessage || err.message,
        );
      }

      if (!result || result.length === 0) {
        db.query(
          `CREATE TABLE STARTUP_PROFILE (
             profile_id VARCHAR(10) PRIMARY KEY,
             startup_id VARCHAR(10) NOT NULL,
             description TEXT,
             problem_statement TEXT,
             target_market TEXT,
             business_model TEXT,
             product_name VARCHAR(100),
             product_category VARCHAR(100),
             current_version VARCHAR(50),
             product_price DECIMAL(12,2),
             launch_date DATE,
             features TEXT,
             market_size VARCHAR(100),
             competitors TEXT,
             current_customers INT,
             monthly_revenue DECIMAL(12,2),
             future_roadmap TEXT,
             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
             UNIQUE KEY ux_startup_profile_startup_id (startup_id),
             FOREIGN KEY (startup_id) REFERENCES STARTUP(startup_id) ON DELETE CASCADE
           ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
          (createErr) => {
            if (createErr) {
              return console.error(
                "Failed to create STARTUP_PROFILE table:",
                createErr.sqlMessage || createErr.message,
              );
            }
            console.log("Created STARTUP_PROFILE table");
          },
        );
        return;
      }

      db.query(
        "SHOW INDEX FROM STARTUP_PROFILE WHERE Key_name = 'ux_startup_profile_startup_id'",
        (indexErr, indexRes) => {
          if (indexErr) {
            return console.warn(
              "Unable to inspect STARTUP_PROFILE indexes:",
              indexErr.sqlMessage || indexErr.message,
            );
          }
          if (!indexRes || indexRes.length === 0) {
            db.query(
              "ALTER TABLE STARTUP_PROFILE ADD UNIQUE KEY ux_startup_profile_startup_id (startup_id)",
              (alterErr) => {
                if (alterErr) {
                  return console.error(
                    "Failed to add unique index to STARTUP_PROFILE.startup_id:",
                    alterErr.sqlMessage || alterErr.message,
                  );
                }
                console.log("Added unique index to STARTUP_PROFILE.startup_id");
              },
            );
          }
        },
      );
    });
  }

  ensureStartupProfileTable();
  console.log("Checkpoint C");

  // Seed INDUSTRY table if empty///////////////////////
  db.query("SELECT COUNT(*) AS cnt FROM INDUSTRY", (err, res) => {
    if (err)
      return console.warn("Could not check INDUSTRY table:", err.message);
    if (res[0].cnt === 0) {
      db.query(
        `INSERT IGNORE INTO INDUSTRY (industry_id, industry_name) VALUES
         ('I001','FinTech'),('I002','HealthTech'),('I003','EdTech')`,
        (insertErr) => {
          if (insertErr)
            return console.error("Industry seed failed:", insertErr.message);
          console.log("Seeded INDUSTRY table");
        },
      );
    }
  });
  ////////////////////////////

  function isValidEmail(email) {
    return (
      typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );
  }

  // ================= HELPER =================
  function generateId(prefix) {
    return prefix + Math.floor(1000 + Math.random() * 9000);
  }

  // ================= AUTH =================
  console.log("Checkpoint D");
  app.post("/signup", (req, res) => {
    const { username, email, password, role } = req.body;

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!passwordRegex.test(password)) {
      return res
        .status(400)
        .send(
          "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character.",
        );
    }

    if (!isValidEmail(email)) {
      return res.status(400).send("Invalid email address.");
    }

    db.query(
      "INSERT INTO USERS (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, password, role],
      (err) => {
        if (err) return res.status(500).send(err.sqlMessage);
        res.send("Signup successful");
      },
    );
  });

  app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).send("Invalid email address.");
    }

    db.query(
      `SELECT u.*, i.investor_id
     FROM USERS u
     LEFT JOIN INVESTOR i ON u.user_id = i.user_id
     WHERE u.email = ? AND u.password = ?`,
      [email, password],
      (err, result) => {
        if (err) return res.status(500).send(err.sqlMessage || "Login failed");

        if (result.length === 0) return res.status(401).send("Invalid");

        const user = result[0];

        if (user.email) {
          db.query(
            "UPDATE FOUNDER SET user_id = ? WHERE TRIM(LOWER(founder_email)) = TRIM(LOWER(?)) AND user_id IS NULL",
            [user.user_id, user.email],
            (updateErr) => {
              if (updateErr)
                console.warn("Founder auto-link failed:", updateErr.sqlMessage);
            },
          );
        }

        const sendLogin = (investorId) => {
          res.json({
            user_id: user.user_id,
            username: user.username,
            role: user.role,
            investor_id: investorId || null,
          });
        };

        if (user.role === "investor" && !user.investor_id) {
          db.query(
            "UPDATE INVESTOR SET user_id = ? WHERE TRIM(LOWER(investor_name)) = TRIM(LOWER(?)) AND user_id IS NULL",
            [user.user_id, user.username],
            (linkErr) => {
              if (linkErr) {
                console.warn("Investor auto-link failed:", linkErr.sqlMessage);
                return sendLogin(null);
              }

              db.query(
                "SELECT investor_id FROM INVESTOR WHERE user_id = ? LIMIT 1",
                [user.user_id],
                (invErr, invRes) => {
                  if (invErr) {
                    console.warn(
                      "Investor fetch after auto-link failed:",
                      invErr.sqlMessage,
                    );
                    return sendLogin(null);
                  }

                  sendLogin(invRes[0]?.investor_id || null);
                },
              );
            },
          );
          return;
        }

        sendLogin(user.investor_id);
      },
    );
  });

  // ================= STARTUPS =================
  app.post("/addStartup", (req, res) => {
    const {
      startup_name,
      founded_year,
      stage,
      industry_id,
      city,
      state,
      country,
      user_id,
    } = req.body;

    const startup_id = generateId("S");

    db.query(
      `INSERT INTO STARTUP VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        startup_id,
        startup_name,
        founded_year,
        stage,
        city,
        state,
        country,
        industry_id,
        user_id,
      ],
      (err) => {
        if (err) return res.status(500).send(err.sqlMessage);
        res.send("Startup added");
      },
    );
  });

  app.post("/addStartupProfile", (req, res) => {
    const {
      startup_id,
      description,
      problem_statement,
      target_market,
      business_model,
      product_name,
      product_category,
      current_version,
      product_price,
      launch_date,
      features,
      market_size,
      competitors,
      current_customers,
      monthly_revenue,
      future_roadmap,
    } = req.body;

    if (!startup_id) {
      return res.status(400).send("startup_id is required");
    }

    const query = `INSERT INTO STARTUP_PROFILE
      (profile_id, startup_id, description, problem_statement, target_market, business_model,
       product_name, product_category, current_version, product_price, launch_date,
       features, market_size, competitors, current_customers, monthly_revenue, future_roadmap)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        description = VALUES(description),
        problem_statement = VALUES(problem_statement),
        target_market = VALUES(target_market),
        business_model = VALUES(business_model),
        product_name = VALUES(product_name),
        product_category = VALUES(product_category),
        current_version = VALUES(current_version),
        product_price = VALUES(product_price),
        launch_date = VALUES(launch_date),
        features = VALUES(features),
        market_size = VALUES(market_size),
        competitors = VALUES(competitors),
        current_customers = VALUES(current_customers),
        monthly_revenue = VALUES(monthly_revenue),
        future_roadmap = VALUES(future_roadmap)`;

    db.query(
      query,
      [
        generateId("P"),
        startup_id,
        description || null,
        problem_statement || null,
        target_market || null,
        business_model || null,
        product_name || null,
        product_category || null,
        current_version || null,
        product_price || null,
        launch_date || null,
        features || null,
        market_size || null,
        competitors || null,
        current_customers || null,
        monthly_revenue || null,
        future_roadmap || null,
      ],
      (err) => {
        if (err) return res.status(500).send(err.sqlMessage);
        res.json({ message: "Startup profile saved" });
      },
    );
  });

  app.get("/startupProfile/:startup_id", (req, res) => {
    const startup_id = req.params.startup_id;
    db.query(
      "SELECT * FROM STARTUP_PROFILE WHERE startup_id = ? LIMIT 1",
      [startup_id],
      (err, result) => {
        if (err) return res.status(500).send(err.sqlMessage);
        res.json(result[0] || {});
      },
    );
  });

  app.get("/startupHealth/:startup_id", (req, res) => {
    const startup_id = req.params.startup_id;

    db.query(
      `SELECT
         (SELECT COALESCE(SUM(i.amount_invested), 0)
          FROM INVESTMENT i
          JOIN FUNDING_ROUND fr ON i.round_id = fr.round_id
          WHERE fr.startup_id = s.startup_id) AS total_funding,
         (SELECT COALESCE(SUM(fr.total_amount_raised), 0)
          FROM FUNDING_ROUND fr
          WHERE fr.startup_id = s.startup_id
            AND fr.total_amount_raised > 0) AS target_funding,
         (SELECT COUNT(DISTINCT i.investor_id)
          FROM INVESTMENT i
          JOIN FUNDING_ROUND fr ON i.round_id = fr.round_id
          WHERE fr.startup_id = s.startup_id) AS investor_count,
         (SELECT sp.current_customers
          FROM STARTUP_PROFILE sp
          WHERE sp.startup_id = s.startup_id
          LIMIT 1) AS current_customers,
         (SELECT sp.monthly_revenue
          FROM STARTUP_PROFILE sp
          WHERE sp.startup_id = s.startup_id
          LIMIT 1) AS monthly_revenue
       FROM STARTUP s
       WHERE s.startup_id = ?`,
      [startup_id],
      (err, result) => {
        if (err) return res.status(500).send(err.sqlMessage);
        if (result.length === 0)
          return res.status(404).send("Startup not found");

        const {
          total_funding,
          target_funding,
          investor_count,
          current_customers,
          monthly_revenue,
        } = result[0];

        const fundingProgress =
          target_funding > 0
            ? Math.min(1, total_funding / target_funding)
            : total_funding > 0
              ? 0.5
              : 0;
        const funding_score = Math.round(fundingProgress * 40);

        const customer_score = Math.round(
          Math.min(1, (current_customers || 0) / 1000) * 25,
        );
        const revenue_score = Math.round(
          Math.min(1, (monthly_revenue || 0) / 1000000) * 25,
        );
        const investor_score = Math.round(
          Math.min(1, (investor_count || 0) / 20) * 10,
        );

        const health_score = Math.min(
          100,
          funding_score + customer_score + revenue_score + investor_score,
        );

        res.json({
          health_score,
          funding_score,
          customer_score,
          revenue_score,
          investor_score,
          total_funding,
          target_funding,
          investor_count,
          current_customers,
          monthly_revenue,
        });
      },
    );
  });

  // Γ£à RESTORED
  app.get("/startups/:user_id", (req, res) => {
    db.query(
      `SELECT DISTINCT s.*
     FROM STARTUP s
     LEFT JOIN FOUNDER f ON s.startup_id = f.startup_id
     LEFT JOIN USERS u2 ON TRIM(LOWER(u2.email)) = TRIM(LOWER(f.founder_email))
     WHERE s.user_id = ? OR f.user_id = ? OR u2.user_id = ?`,
      [req.params.user_id, req.params.user_id, req.params.user_id],
      (err, result) => {
        if (err) return res.status(500).send(err.sqlMessage);
        res.json(result);
      },
    );
  });

  // ================= FOUNDERS =================
  app.post("/addFounder", (req, res) => {
    const { founders, startup_id } = req.body;

    if (!Array.isArray(founders) || founders.length === 0) {
      return res.status(400).send("No founders provided");
    }

    let totalNewEquity = 0;

    for (const founder of founders) {
      const equity = Number(founder.equity);
      if (Number.isNaN(equity) || equity <= 0) {
        return res.status(400).send("Founder equity must be a positive number");
      }

      totalNewEquity += equity;
    }

    if (totalNewEquity > 100) {
      return res
        .status(400)
        .send("Total equity for new founders cannot exceed 100%");
    }

    db.query(
      "SELECT COALESCE(SUM(initial_equity), 0) AS existing_total FROM FOUNDER WHERE startup_id=?",
      [startup_id],
      (err, existingRes) => {
        if (err) return res.status(500).send(err.sqlMessage);

        const existingTotal = existingRes[0]?.existing_total || 0;
        if (existingTotal + totalNewEquity > 100) {
          return res
            .status(400)
            .send("Total founder equity cannot exceed 100%");
        }

        db.query("SELECT NOW() as now", (err, timeRes) => {
          if (err) return res.status(500).send(err.sqlMessage);

          const snapshotTime = timeRes[0].now;

          // ≡ƒöÑ STEP 1: GET OR CREATE ROUND (ONLY ONCE)
          db.query(
            "SELECT round_id FROM FUNDING_ROUND WHERE startup_id=? ORDER BY round_date DESC LIMIT 1",
            [startup_id],
            (err, roundRes) => {
              if (err) return res.status(500).send(err.sqlMessage);

              let round_id;

              if (roundRes.length === 0) {
                round_id = generateId("R");

                //     db.query(
                //       `INSERT INTO FUNDING_ROUND
                //  (round_id, round_type, round_date, valuation, total_amount_raised, startup_id)
                //  VALUES (?, 'Initial', CURDATE(), 0, 0, ?)`,
                //       [round_id, startup_id],
                //       (err2) => {
                //         if (err2) return res.status(500).send(err2.sqlMessage);

                //         insertAllFounders(round_id);
                //       },
                //     );
                db.query(
                  "SELECT founded_year FROM STARTUP WHERE startup_id = ?",
                  [startup_id],
                  (yearErr, yearRes) => {
                    if (yearErr)
                      return res.status(500).send(yearErr.sqlMessage);

                    const foundedYear = yearRes[0].founded_year;
                    const initialRoundDate = `${foundedYear}-01-01`;

                    db.query(
                      `INSERT INTO FUNDING_ROUND
       (round_id, round_type, round_date, valuation, total_amount_raised, startup_id)
       VALUES (?, 'Initial', ?, 0, 0, ?)`,
                      [round_id, initialRoundDate, startup_id],
                      (err2) => {
                        if (err2) return res.status(500).send(err2.sqlMessage);

                        insertAllFounders(round_id);
                      },
                    );
                  },
                );
              } else {
                round_id = roundRes[0].round_id;
                insertAllFounders(round_id);
              }

              // ≡ƒöÑ STEP 2: INSERT FOUNDERS + EQUITY
              function insertAllFounders(round_id) {
                let completed = 0;

                founders.forEach((f) => {
                  const founder_id = generateId("F");

                  // Link the founder to an existing user account by email so the co-founder
                  // can see the startup when they log in.
                  db.query(
                    "SELECT user_id FROM USERS WHERE TRIM(LOWER(email)) = TRIM(LOWER(?))",
                    [f.email],
                    (err1, userRes) => {
                      if (err1) return res.status(500).send(err1.sqlMessage);

                      const founderUserId =
                        userRes.length > 0 ? userRes[0].user_id : null;
                      const founderEmail = f.email || null;

                      db.query(
                        `INSERT INTO FOUNDER 
                   (founder_id, founder_name, founder_email, founder_role, initial_equity, startup_id, user_id)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                          founder_id,
                          f.name,
                          founderEmail,
                          f.role,
                          f.equity,
                          startup_id,
                          founderUserId,
                        ],
                        (err2) => {
                          if (err2)
                            return res.status(500).send(err2.sqlMessage);

                          // Γ£à insert into EQUITY_HISTORY (FIXED)
                          db.query(
                            `INSERT INTO EQUITY_HISTORY
                       (ownership_id, startup_id, round_id, stakeholder_type, stakeholder_id, equity_percentage, recorded_at)
                       VALUES (?, ?, ?, 'Founder', ?, ?, ?)`,
                            [
                              generateId("H"),
                              startup_id,
                              round_id, // Γ£à dynamic (NO R0)
                              founder_id,
                              f.equity,
                              snapshotTime,
                            ],
                            (err3) => {
                              if (err3)
                                return res.status(500).send(err3.sqlMessage);

                              completed++;

                              if (completed === founders.length) {
                                res.send("All founders added");
                              }
                            },
                          );
                        },
                      );
                    },
                  );
                });
              }
            },
          );
        });
      },
    );
  });

  // edit founders info
  app.put("/updateFounder/:founder_id", (req, res) => {
    const { founder_name, founder_email, founder_role } = req.body;

    db.query(
      `UPDATE FOUNDER
     SET founder_name = ?,
         founder_email = ?,
         founder_role = ?
     WHERE founder_id = ?`,
      [founder_name, founder_email, founder_role, req.params.founder_id],
      (err) => {
        if (err) return res.status(500).send(err.sqlMessage);
        res.send("Founder updated");
      },
    );
  });

  // Γ£à RESTORED
  app.get("/founders/:user_id", (req, res) => {
    const uid = req.params.user_id;
    db.query(
      `SELECT DISTINCT f.*, s.startup_name, COALESCE(u.email, f.founder_email) AS founder_email
     FROM FOUNDER f
     JOIN STARTUP s ON f.startup_id = s.startup_id
     LEFT JOIN USERS u ON f.user_id = u.user_id
     LEFT JOIN USERS u2 ON TRIM(LOWER(u2.email)) = TRIM(LOWER(f.founder_email))
     WHERE s.user_id = ?
       OR f.user_id = ?
       OR u2.user_id = ?
       OR f.startup_id IN (
            SELECT f2.startup_id FROM FOUNDER f2
            LEFT JOIN USERS u3 ON TRIM(LOWER(u3.email)) = TRIM(LOWER(f2.founder_email))
            WHERE f2.user_id = ? OR u3.user_id = ?
          )`,
      [uid, uid, uid, uid, uid],
      (err, result) => {
        if (err) return res.status(500).send(err.sqlMessage);
        res.json(result);
      },
    );
  });

  // ================= FUNDING =================
  app.post("/addFunding", (req, res) => {
    const {
      startup_id,
      round_type,
      round_date,
      valuation,
      total_amount_raised,
    } = req.body;
    const allowedRoundTypes = [
      "Initial",
      "Pre-Seed",
      "Seed",
      "Series A",
      "Series B",
      "Series C",
    ];
    if (!allowedRoundTypes.includes(round_type)) {
      return res.status(400).send(`Invalid round_type: ${round_type}`);
    }
    const round_id = generateId("R");
    db.query(
      `INSERT INTO FUNDING_ROUND VALUES (?, ?, ?, ?, ?, ?)`,
      [
        round_id,
        round_type,
        new Date(round_date).toISOString().slice(0, 10),
        valuation,
        total_amount_raised,
        startup_id,
      ],
      (err) => {
        if (err) return res.status(500).send(err.sqlMessage);
        res.send("Funding added");
      },
    );
  });

  // edit button function
  app.put("/updateFunding/:round_id", (req, res) => {
    const { round_type, round_date, valuation, total_amount_raised } = req.body;

    db.query(
      `UPDATE FUNDING_ROUND
     SET round_type = ?,
         round_date = ?,
         valuation = ?,
         total_amount_raised = ?
     WHERE round_id = ?`,
      [
        round_type,
        round_date,
        valuation,
        total_amount_raised,
        req.params.round_id,
      ],
      (err) => {
        if (err) return res.status(500).send(err.sqlMessage);
        res.send("Funding round updated");
      },
    );
  });
  // end of edit function

  // Γ£à RESTORED
  app.get("/funding/:user_id", (req, res) => {
    const uid = req.params.user_id;
    db.query(
      `SELECT DISTINCT fr.*, s.startup_name
     FROM FUNDING_ROUND fr
     JOIN STARTUP s ON fr.startup_id = s.startup_id
     LEFT JOIN FOUNDER f ON s.startup_id = f.startup_id
     LEFT JOIN USERS u2 ON TRIM(LOWER(u2.email)) = TRIM(LOWER(f.founder_email))
     WHERE s.user_id = ? OR f.user_id = ? OR u2.user_id = ?`,
      [uid, uid, uid],
      (err, result) => {
        if (err) return res.status(500).send(err.sqlMessage);
        res.json(result);
      },
    );
  });

  app.get("/investors", (req, res) => {
    db.query(
      `SELECT investor_id, investor_name, firm_name, investor_type, country
     FROM INVESTOR
     ORDER BY investor_name`,
      (err, result) => {
        if (err) return res.status(500).send(err.sqlMessage);
        res.json(result);
      },
    );
  });

  app.post("/addInvestor", (req, res) => {
    const { name, firm, type, country } = req.body;

    db.query(
      `INSERT INTO INVESTOR
     (investor_id, investor_name, firm_name, investor_type, country)
     VALUES (?, ?, ?, ?, ?)`,
      [generateId("I"), name, firm, type, country],
      (err) => {
        if (err) return res.status(500).send(err.sqlMessage);
        res.send("Investor added");
      },
    );
  });

  app.get("/investments/:user_id", (req, res) => {
    db.query(
      `SELECT DISTINCT
      inv.investor_name,
      fr.round_type,
      i.amount_invested,
      i.equity_acquired
     FROM INVESTMENT i
     JOIN INVESTOR inv ON i.investor_id = inv.investor_id
     JOIN FUNDING_ROUND fr ON i.round_id = fr.round_id
     JOIN STARTUP s ON fr.startup_id = s.startup_id
     LEFT JOIN FOUNDER f ON s.startup_id = f.startup_id
     LEFT JOIN USERS u2 ON TRIM(LOWER(u2.email)) = TRIM(LOWER(f.founder_email))
     WHERE s.user_id = ? OR f.user_id = ? OR u2.user_id = ?`,
      [req.params.user_id, req.params.user_id, req.params.user_id],
      (err, result) => {
        if (err) return res.status(500).send(err.sqlMessage);
        res.json(result);
      },
    );
  });

  // ================= INVESTMENT =================
  app.post("/addInvestment", (req, res) => {
    const {
      round_id,
      user_id,
      investor_id: providedInvestorId,
      username,
      firm_name,
      country,
      amount,
      equity,
    } = req.body;

    const equityNum = Number(equity);

    console.log("Incoming Investment:", req.body);

    // Get or create investor
    db.query(
      "SELECT investor_id FROM INVESTOR WHERE user_id=? OR investor_id=?",
      [user_id, providedInvestorId || null],
      (err, invRes) => {
        if (err) return res.status(500).send(err.sqlMessage);

        let investor_id;

        if (invRes.length === 0) {
          investor_id = generateId("I");

          db.query(
            `INSERT INTO INVESTOR 
           (investor_id, investor_name, firm_name, country, user_id)
           VALUES (?, ?, ?, ?, ?)`,
            [
              investor_id,
              username || "Investor",
              firm_name || "Individual",
              country || "Unknown",
              user_id,
            ],
            (insertErr) => {
              if (insertErr) return res.status(500).send(insertErr.sqlMessage);
              processInvestment();
            },
          );
        } else {
          investor_id = invRes[0].investor_id;
          processInvestment();
        }

        function processInvestment() {
          // Get round info and startup_id
          db.query(
            "SELECT fr.startup_id, fr.round_id FROM FUNDING_ROUND fr WHERE fr.round_id = ?",
            [round_id],
            (roundErr, roundRes) => {
              if (roundErr) return res.status(500).send(roundErr.sqlMessage);
              if (roundRes.length === 0)
                return res.status(400).send("Round not found");

              const startup_id = roundRes[0].startup_id;

              db.query("SELECT NOW() as now", (timeErr, timeRes) => {
                if (timeErr) return res.status(500).send(timeErr.sqlMessage);
                const snapshotTime = timeRes[0].now;

                // Get existing equity holders
                db.query(
                  `SELECT *
                  FROM (
                    SELECT *,
                      ROW_NUMBER() OVER (
                        PARTITION BY stakeholder_id, stakeholder_type
                        ORDER BY recorded_at DESC
                      ) AS rn
                    FROM EQUITY_HISTORY
                    WHERE startup_id = ?
                  ) latest
                  WHERE rn = 1`,
                  [startup_id],
                  (histErr, lastData) => {
                    if (histErr)
                      return res.status(500).send(histErr.sqlMessage);

                    if (lastData.length === 0) {
                      // No existing holders, just insert investor equity
                      db.query(
                        `INSERT INTO EQUITY_HISTORY 
                       (ownership_id, startup_id, round_id, stakeholder_type, stakeholder_id, equity_percentage, recorded_at)
                       VALUES (?, ?, ?, 'Investor', ?, ?, ?)`,
                        [
                          generateId("H"),
                          startup_id,
                          round_id,
                          investor_id,
                          equityNum,
                          snapshotTime,
                        ],
                        (eqErr) => {
                          if (eqErr)
                            return res.status(500).send(eqErr.sqlMessage);
                          insertInvestment();
                        },
                      );
                      return;
                    }

                    let completed = 0;
                    let investorHandled = false;
                    const dilutionFactor = (100 - equityNum) / 100;

                    lastData.forEach((row) => {
                      let newEquity =
                        Number(row.equity_percentage) * dilutionFactor;

                      if (
                        row.stakeholder_type === "Investor" &&
                        row.stakeholder_id === investor_id
                      ) {
                        newEquity += equityNum;
                        investorHandled = true;
                      }

                      db.query(
                        `INSERT INTO EQUITY_HISTORY 
                       (ownership_id, startup_id, round_id, stakeholder_type, stakeholder_id, equity_percentage, recorded_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                          generateId("H"),
                          startup_id,
                          round_id,
                          row.stakeholder_type,
                          row.stakeholder_id,
                          Number(newEquity.toFixed(4)),
                          snapshotTime,
                        ],
                        (err4) => {
                          if (err4)
                            return res.status(500).send(err4.sqlMessage);

                          completed++;
                          if (completed === lastData.length) {
                            if (!investorHandled) {
                              insertInvestorHistory(insertInvestment);
                            } else {
                              insertInvestment();
                            }
                          }
                        },
                      );
                    });

                    function insertInvestorHistory(callback) {
                      db.query(
                        `INSERT INTO EQUITY_HISTORY 
                       (ownership_id, startup_id, round_id, stakeholder_type, stakeholder_id, equity_percentage, recorded_at)
                       VALUES (?, ?, ?, 'Investor', ?, ?, ?)`,
                        [
                          generateId("H"),
                          startup_id,
                          round_id,
                          investor_id,
                          equityNum,
                          snapshotTime,
                        ],
                        callback,
                      );
                    }
                  },
                );
              });
            },
          );
        }

        // Store investment separately
        function insertInvestment() {
          const investment_id = generateId("IV");
          db.query(
            `INSERT INTO INVESTMENT 
           (investment_id, round_id, investor_id, amount_invested, equity_acquired)
           VALUES (?, ?, ?, ?, ?)`,
            [investment_id, round_id, investor_id, amount, equity],
            (err) => {
              if (err) return res.status(500).send(err.sqlMessage);

              res.json({
                message: "Investment added successfully",
                investment_id,
              });
            },
          );
        }
      },
    );
  });

  console.log("Checkpoint E");
  app.get("/investmentReceipt/:investment_id", async (req, res) => {
    const investment_id = req.params.investment_id;

    db.query(
      `SELECT
      i.investment_id,
      NOW() AS investment_date,
      i.amount_invested,
      i.equity_acquired,
      fr.round_type,
      fr.valuation,
      fr.round_date,
      s.startup_id,
      s.startup_name,
      s.stage,
      s.city,
      s.country,
      s.industry_id,
      inv.investor_id,
      inv.investor_name,
      inv.investor_type,
      inv.firm_name,
      inv.country AS investor_country,
      (SELECT industry_name FROM INDUSTRY WHERE industry_id = s.industry_id LIMIT 1) AS industry_name,
      (SELECT GROUP_CONCAT(f.founder_name SEPARATOR ', ')
 FROM FOUNDER f
 WHERE f.startup_id = s.startup_id) AS founder_name
     FROM INVESTMENT i
     JOIN FUNDING_ROUND fr ON i.round_id = fr.round_id
     JOIN STARTUP s ON fr.startup_id = s.startup_id
     JOIN INVESTOR inv ON i.investor_id = inv.investor_id
     WHERE i.investment_id = ?
     LIMIT 1`,
      [investment_id],
      async (err, result) => {
        if (err) return res.status(500).send(err.sqlMessage);
        if (!result || result.length === 0)
          return res.status(404).send("Investment not found");

        const data = result[0];
        const ownershipQuery = `SELECT stakeholder_type, SUM(equity_percentage) AS equity_sum
        FROM (
          SELECT *, ROW_NUMBER() OVER (
            PARTITION BY stakeholder_id, stakeholder_type
            ORDER BY recorded_at DESC
          ) AS rn
          FROM EQUITY_HISTORY
          WHERE startup_id = ?
        ) t
        WHERE rn = 1
        GROUP BY stakeholder_type`;

        db.query(
          ownershipQuery,
          [data.startup_id],
          (ownershipErr, ownershipRows) => {
            if (ownershipErr)
              return res.status(500).send(ownershipErr.sqlMessage);

            const summary = {
              founder: 0,
              investor: 0,
              remaining: 0,
            };

            ownershipRows.forEach((row) => {
              if (row.stakeholder_type === "Founder")
                summary.founder += Number(row.equity_sum || 0);
              if (row.stakeholder_type === "Investor")
                summary.investor += Number(row.equity_sum || 0);
            });
            summary.founder = Number(summary.founder.toFixed(2));
            summary.investor = Number(summary.investor.toFixed(2));
            summary.remaining = Number(
              Math.max(0, 100 - summary.founder - summary.investor).toFixed(2),
            );

            const doc = new PDFDocument({ size: "A4", margin: 50 });
            const filename = `SFITS-Investment-Certificate-${investment_id}.pdf`;

            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="${filename}"`,
            );
            doc.pipe(res);

            doc.fillColor("#0f172a");
            doc
              .fontSize(20)
              .font("Helvetica-Bold")
              .text("SFITS", { align: "center" });
            doc.moveDown(0.25);
            doc
              .fontSize(10)
              .font("Helvetica")
              .fillColor("#475569")
              .text("Startup Funding & Investment Tracking System", {
                align: "center",
              });
            doc.moveDown(1);
            doc
              .fillColor("#111827")
              .fontSize(18)
              .font("Helvetica-Bold")
              .text("INVESTMENT CERTIFICATE", { align: "center" });

            doc
              .fontSize(10)
              .font("Helvetica")
              .fillColor("#475569")
              .text(`Certificate No: ${data.investment_id}`, {
                align: "center",
              });
            doc.moveDown(1.2);

            doc.fontSize(10).fillColor("#475569");
            doc.text(
              "This certificate confirms that the investment transaction below has been successfully recorded in the SFITS platform.",
              {
                align: "center",
                lineGap: 4,
              },
            );
            doc.moveDown(1.5);

            const left = doc.x;
            const tableWidth =
              doc.page.width - doc.page.margins.left - doc.page.margins.right;
            const sectionWidth = tableWidth;

            const drawSection = (title) => {
              doc.moveDown(0.3);

              doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke("#cbd5e1");

              doc.moveDown(0.3);

              doc
                .fontSize(12)
                .fillColor("#0f172a")
                .font("Helvetica-Bold")
                .text(title);

              doc.moveDown(0.25);
            };

            drawSection("Investor Details");
            doc.fontSize(10).font("Helvetica");
            doc.text(`Investor Name : ${data.investor_name || "N/A"}`);
            doc.text(`Investor Type : ${data.investor_type || "N/A"}`);
            doc.text(`Firm Name : ${data.firm_name || "N/A"}`);
            doc.text(`Country : ${data.investor_country || "N/A"}`);
            doc.moveDown(0.8);

            drawSection("Startup Details");
            doc.text(`Startup Name : ${data.startup_name || "N/A"}`);
            doc.text(`Industry : ${data.industry_name || "N/A"}`);
            doc.text(`Stage : ${data.stage || "N/A"}`);
            doc.text(
              `Location : ${[data.city, data.country].filter(Boolean).join(", ") || "N/A"}`,
            );
            doc.text(`Founder : ${data.founder_name || "N/A"}`);
            doc.moveDown(0.8);

            drawSection("Investment Details");
            doc.text(`Investment ID : ${data.investment_id}`);
            doc.text(`Funding Round : ${data.round_type || "N/A"}`);
            doc.text(
              `Date : ${new Date(data.investment_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
            );
            doc.font("Helvetica-Bold");
            doc.text(
              `Amount Invested : Rs ${Number(data.amount_invested || 0).toLocaleString("en-IN")}`,
            );
            doc.font("Helvetica");
            doc.font("Helvetica-Bold");
            doc.text(
              `Equity Acquired : ${Number(data.equity_acquired || 0).toFixed(2)}%`,
            );
            doc.font("Helvetica");
            doc.font("Helvetica-Bold");
            doc.text(
              `Valuation : Rs ${Number(data.valuation || 0).toLocaleString("en-IN")}`,
            );
            doc.font("Helvetica");
            doc.moveDown(0.8);

            drawSection("Ownership Impact");
            doc.text(`Founder Ownership : ${summary.founder.toFixed(2)}%`);
            doc.text(`Investor Ownership : ${summary.investor.toFixed(2)}%`);
            doc.text(`Remaining Ownership : ${summary.remaining.toFixed(2)}%`);
            doc.moveDown(0.8);

            drawSection("Certificate Statement");
            doc.fontSize(10).fillColor("#475569");
            doc.text(
              "This document serves as a digital confirmation that the above investment transaction has been successfully recorded in the SFITS platform.",
              { lineGap: 4 },
            );
            doc.text(
              "This certificate is automatically generated for record keeping and investment tracking purposes.",
              { lineGap: 4 },
            );
            doc.moveDown(1.2);

            // Footer area background
            const footerTop = doc.y;
            const footerHeight = 100;
            doc.save();
            doc
              .rect(left, footerTop, sectionWidth, footerHeight)
              .fillOpacity(0.04)
              .fill("#0f172a");
            doc.restore();
            doc
              .fillColor("#0f172a")
              .fontSize(10)
              .font("Helvetica-Bold")
              .text("Generated By:", left + 10, footerTop + 12);
            doc
              .font("Helvetica")
              .text("SFITS - Startup Funding & Investment Tracking System", {
                indent: 15,
                continued: false,
              });
            doc.moveDown(0.4);
            doc.font("Helvetica-Bold").text("Generated On:", { indent: 10 });
            doc.font("Helvetica").text(
              new Date().toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              { indent: 15 },
            );

            const qrPayload = JSON.stringify({
              investment_id: data.investment_id,
              investor_id: data.investor_id,
              startup_id: data.startup_id,
            });

            QRCode.toDataURL(qrPayload, { margin: 1, width: 160 })
              .then((qrDataUrl) => {
                const imgY = footerTop + 12;
                doc.image(qrDataUrl, left + sectionWidth - 120, imgY, {
                  width: 90,
                  align: "right",
                });
                doc.moveDown(8);
                doc.end();
              })
              .catch((qrErr) => {
                console.error("QR generation failed:", qrErr);
                doc.end();
              });
          },
        );
      },
    );
  });

  // ================= EXTRA (USED IN UI) =================
  app.get("/allRounds", (req, res) => {
    db.query(
      `SELECT
       fr.round_id,
       fr.round_type,
       fr.round_date,
       fr.valuation,
       fr.total_amount_raised AS target_funding,
       s.startup_id,
       s.startup_name,
       s.stage,
       s.city,
       s.country,
       COALESCE(round_summary.amount_raised, 0)   AS amount_raised,
       COALESCE(startup_summary.investor_count, 0) AS investor_count
     FROM FUNDING_ROUND fr
     JOIN STARTUP s ON fr.startup_id = s.startup_id
     JOIN (
       SELECT startup_id, MAX(round_date) AS max_date
       FROM FUNDING_ROUND
       GROUP BY startup_id
     ) latest ON fr.startup_id = latest.startup_id
       AND fr.round_date = latest.max_date
     LEFT JOIN (
       SELECT i.round_id,
              SUM(i.amount_invested)       AS amount_raised
       FROM INVESTMENT i
       GROUP BY i.round_id
     ) round_summary ON round_summary.round_id = fr.round_id
     LEFT JOIN (
       SELECT fr.startup_id,
              COUNT(DISTINCT i.investor_id) AS investor_count
       FROM INVESTMENT i
       JOIN FUNDING_ROUND fr ON i.round_id = fr.round_id
       GROUP BY fr.startup_id
     ) startup_summary ON startup_summary.startup_id = s.startup_id
     ORDER BY s.startup_name`,
      (err, result) => {
        if (err) return res.status(500).send(err.sqlMessage);
        res.json(result);
      },
    );
  });
  app.get("/capTable/:startup_id", (req, res) => {
    const startup_id = req.params.startup_id;

    // Γ£à Show current equity state for each stakeholder
    db.query(
      `SELECT
      COALESCE(f.founder_name, i.investor_name) AS stakeholder,
      eh.stakeholder_type,
      CASE
        WHEN eh.stakeholder_type = 'Founder' THEN
          CASE
            WHEN TRIM(COALESCE(f.founder_role, '')) = '' THEN 'Founder'
            WHEN LOWER(COALESCE(f.founder_role, '')) LIKE '%co-founder%' OR LOWER(COALESCE(f.founder_role, '')) LIKE '%cofounder%' THEN f.founder_role
            WHEN LOWER(COALESCE(f.founder_role, '')) LIKE '%founder%' THEN f.founder_role
            ELSE CONCAT('Co-Founder & ', f.founder_role)
          END
        ELSE eh.stakeholder_type
      END AS stakeholder_label,
      SUM(eh.equity_percentage) AS equity_percentage
    FROM (
      SELECT *,
        ROW_NUMBER() OVER (
          PARTITION BY stakeholder_id, stakeholder_type
          ORDER BY recorded_at DESC
        ) AS rn
      FROM EQUITY_HISTORY
      WHERE startup_id=?
    ) eh
    LEFT JOIN FOUNDER f ON eh.stakeholder_id = f.founder_id
    LEFT JOIN INVESTOR i ON eh.stakeholder_id = i.investor_id
    WHERE eh.rn = 1
    GROUP BY stakeholder, eh.stakeholder_type, stakeholder_label`,
      [startup_id],
      (err2, result) => {
        if (err2) return res.status(500).send(err2.sqlMessage);
        res.json(result);
      },
    );
  });

  app.get("/history/:startup_id", (req, res) => {
    const startup_id = req.params.startup_id;

    // Build history from FOUNDER and INVESTMENT with proper dilution calculation
    db.query(
      `SELECT 
      f.founder_id,
      f.founder_name,
      f.founder_role,
      f.initial_equity
     FROM FOUNDER f
     WHERE f.startup_id = ?`,
      [startup_id],
      (founderErr, founders) => {
        if (founderErr) return res.status(500).send(founderErr.sqlMessage);

        db.query(
          `SELECT fr.round_id, fr.round_type, fr.round_date,
          i.investor_id,
          inv.investor_name,
          i.equity_acquired
         FROM INVESTMENT i
         JOIN FUNDING_ROUND fr ON i.round_id = fr.round_id
         JOIN INVESTOR inv ON i.investor_id = inv.investor_id
         WHERE fr.startup_id = ?
         ORDER BY fr.round_date ASC`,
          [startup_id],
          (investErr, rounds) => {
            if (investErr) return res.status(500).send(investErr.sqlMessage);

            const ownership = new Map();
            const historyRows = [];

            // Initialize founders with their initial equity
            founders.forEach((f) => {
              ownership.set(`Founder:${f.founder_id}`, {
                name: f.founder_name,
                type: "Founder",
                label: normalizeFounderLabel(f.founder_role),
                equity: Number(f.initial_equity) || 0,
              });
            });

            // Add initial state if founders exist
            if (ownership.size > 0) {
              ownership.forEach((holder) => {
                historyRows.push({
                  round_id: "INIT",
                  round_type: "Initial",
                  round_date: new Date().toISOString().split("T")[0],
                  stakeholder_type: holder.type,
                  stakeholder: holder.name,
                  stakeholder_label: holder.label,
                  equity_percentage: Number(holder.equity.toFixed(2)),
                  recorded_at: new Date().toISOString(),
                });
              });
            }

            // Group rounds by round_id
            const roundsMap = {};
            rounds.forEach((round) => {
              if (!roundsMap[round.round_id]) {
                roundsMap[round.round_id] = {
                  round_id: round.round_id,
                  round_type: round.round_type,
                  round_date: round.round_date,
                  investments: [],
                };
              }
              roundsMap[round.round_id].investments.push({
                investor_id: round.investor_id,
                investor_name: round.investor_name,
                equity_acquired: Number(round.equity_acquired) || 0,
              });
            });

            // Process each round with dilution
            Object.values(roundsMap).forEach((round) => {
              const totalNewEquity = round.investments.reduce(
                (sum, inv) => sum + inv.equity_acquired,
                0,
              );

              // Apply dilution to all existing holders
              if (totalNewEquity > 0 && ownership.size > 0) {
                const dilutionFactor = (100 - totalNewEquity) / 100;
                ownership.forEach((holder) => {
                  holder.equity = Number(
                    (holder.equity * dilutionFactor).toFixed(4),
                  );
                });
              }

              // Add/update investors for this round
              round.investments.forEach((inv) => {
                const key = `Investor:${inv.investor_id}`;
                if (ownership.has(key)) {
                  ownership.get(key).equity += inv.equity_acquired;
                } else {
                  ownership.set(key, {
                    name: inv.investor_name,
                    type: "Investor",
                    label: "Investor",
                    equity: inv.equity_acquired,
                  });
                }
              });

              // Add snapshot for this round with ALL stakeholders showing their diluted/updated equity
              ownership.forEach((holder) => {
                if (holder.equity > 0.01) {
                  // Include if equity is meaningful (> 0.01%)
                  historyRows.push({
                    round_id: round.round_id,
                    round_type: round.round_type,
                    round_date: round.round_date,
                    stakeholder_type: holder.type,
                    stakeholder: holder.name,
                    stakeholder_label: holder.label,
                    equity_percentage: Number(holder.equity.toFixed(2)),
                    recorded_at: round.round_date,
                  });
                }
              });
            });

            function normalizeFounderLabel(founderRole) {
              const roleText = String(founderRole || "").trim();
              const normalizedRole = roleText.toLowerCase();

              if (!normalizedRole) return "Founder";
              if (
                normalizedRole.includes("co-founder") ||
                normalizedRole.includes("cofounder")
              ) {
                return roleText;
              }
              if (normalizedRole.includes("founder")) {
                return roleText;
              }
              return `Co-Founder & ${roleText}`;
            }

            res.json(historyRows);
          },
        );
      },
    );
  });

  // ================= GET INVESTOR =================
  app.get("/getInvestor/:user_id", (req, res) => {
    db.query(
      "SELECT investor_id FROM INVESTOR WHERE user_id=?",
      [req.params.user_id],
      (err, result) => {
        if (err) return res.status(500).send(err.sqlMessage);

        if (result.length === 0) {
          return res.json({ investor_id: null });
        }

        res.json({ investor_id: result[0].investor_id });
      },
    );
  });

  // ================= MY INVESTMENTS =================
  app.get("/myInvestments/:investor_id", (req, res) => {
    db.query(
      `SELECT 
      i.investment_id,
      s.startup_id,
      s.startup_name,
      fr.round_type,
      i.amount_invested,
      i.equity_acquired
     FROM INVESTMENT i
     JOIN FUNDING_ROUND fr ON i.round_id = fr.round_id
     JOIN STARTUP s ON fr.startup_id = s.startup_id
     WHERE i.investor_id = ?`,
      [req.params.investor_id],
      (err, result) => {
        if (err) return res.status(500).send(err.sqlMessage);
        res.json(result);
      },
    );
  });
  // ================= INVESTOR SUMMARY =================
  app.get("/investorSummary/:investor_id", (req, res) => {
    db.query(
      `SELECT 
      SUM(amount_invested) AS total_invested,
      COUNT(DISTINCT fr.startup_id) AS total_startups,
      SUM(equity_acquired) AS total_equity
     FROM INVESTMENT i
     JOIN FUNDING_ROUND fr ON i.round_id = fr.round_id
     WHERE i.investor_id = ?`,
      [req.params.investor_id],
      (err, result) => {
        if (err) return res.status(500).send(err.sqlMessage);
        res.json(result[0]);
      },
    );
  });

  // ================= ALL STARTUPS =================
  app.get("/allStartups", (req, res) => {
    db.query("SELECT * FROM STARTUP", (err, result) => {
      if (err) return res.status(500).send(err.sqlMessage);
      res.json(result);
    });
  });
  app.get("/startupDashboard/:startup_id", (req, res) => {
    const startup_id = req.params.startup_id;

    db.query(
      `SELECT 
      s.startup_name,
      s.stage,

      -- latest round
      (SELECT fr.round_type 
      FROM FUNDING_ROUND fr 
      WHERE fr.startup_id = s.startup_id 
      AND fr.round_type != 'Initial'
      ORDER BY fr.round_date DESC 
      LIMIT 1) AS latest_round,

      -- latest valuation
      (SELECT fr.valuation 
      FROM FUNDING_ROUND fr 
      WHERE fr.startup_id = s.startup_id 
      AND fr.valuation > 0
      ORDER BY fr.round_date DESC 
      LIMIT 1) AS valuation,

      -- Γ£à CORRECT total funding
      (SELECT COALESCE(SUM(i.amount_invested),0)
      FROM INVESTMENT i
      JOIN FUNDING_ROUND fr ON i.round_id = fr.round_id
      WHERE fr.startup_id = s.startup_id
      ) AS total_funding,

      (SELECT COALESCE(SUM(fr.total_amount_raised),0)
      FROM FUNDING_ROUND fr
      WHERE fr.startup_id = s.startup_id
      AND fr.total_amount_raised > 0
      ) AS target_funding,

      -- Γ£à CORRECT total investors
      (SELECT COUNT(DISTINCT i.investor_id)
      FROM INVESTMENT i
      JOIN FUNDING_ROUND fr ON i.round_id = fr.round_id
      WHERE fr.startup_id = s.startup_id
      ) AS total_investors,

      -- Γ£à latest founder equity (your logic is good ≡ƒæì)
      (
    SELECT COALESCE(SUM(equity_percentage),0)
    FROM (
      SELECT stakeholder_id, stakeholder_type, equity_percentage
      FROM (
        SELECT *,
              ROW_NUMBER() OVER (
                PARTITION BY stakeholder_id
                ORDER BY recorded_at DESC
              ) as rn
        FROM EQUITY_HISTORY
        WHERE startup_id = s.startup_id
      ) t
      WHERE rn = 1 AND stakeholder_type = 'Founder'
    ) latest
  ) AS founder_equity

    FROM STARTUP s
    WHERE s.startup_id = ?;`,
      [startup_id],
      (err, result) => {
        if (err) return res.status(500).send(err.sqlMessage);

        console.log("Dashboard Data:", result[0]); // ≡ƒöÑ DEBUG

        res.json(result[0]);
      },
    );
  });

  const PORT = process.env.PORT || 5000;

  // ================= SERVER =================
  console.log("Reached end of routes");

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("Backend file:", __filename);
    console.log("Working directory:", process.cwd());
  });
});
