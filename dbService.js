const mysql = require('mysql');
const dotenv = require('dotenv');
let instance = null;
dotenv.config();

//mysql db connection
const connection = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.DB_PORT,
});

connection.connect((err) => {
  if (err) {
    console.log(err.message);
  }
  console.log('db ' + connection.state);
});

class DbService {
  static getDbServiceInstance() {
    return instance ? instance : new DbService();
  }

  async getAllPatients(...args) {
    const { search_name } = args[0];
    const condition = (ct) =>
      ct != null ? `WHERE name LIKE '%${search_name}%'` : '';
    try {
      const response = await new Promise((resolve, reject) => {
        const query = `SELECT 
              patient.patient_id AS ID,
              patient.name AS Name,
              SUBSTRING(patient.gender, 1, 1) AS Gender,
              DATE_FORMAT(patient.dob, '%Y-%m-%d') AS DOB,
              DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(), patient.dob)),
                      '%Y') + 0 AS Age,
              patient.phone_number AS Contact,
              DATE_FORMAT(patient.date_created, '%Y-%m-%d') AS 'Date Created'
          FROM
              patient ${condition(search_name)};`;
        connection.query(query, (err, results) => {
          if (err) reject(new Error(err.message));
          resolve(results);
        });
      });
      return response;
    } catch (error) {
      console.log(error);
    }
  }

  // async searchByName(name) {
  //   try {
  //     const response = await new Promise((resolve, reject) => {
  //       const query = `SELECT
  //             patient.patient_id AS ID,
  //             name as Name,
  //             gender as Gender,
  //             DATE_FORMAT(dob,'%Y-%m-%d') AS DOB,
  //             DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(), patient.dob)),
  //                     '%Y') + 0 AS Age,
  //             phone_number AS Contact
  //         FROM
  //             patient
  //         WHERE name LIKE '%${name}%';`;
  //       connection.query(query, [name], (err, results) => {
  //         if (err) reject(new Error(err.message));
  //         resolve(results);
  //       });
  //     });

  //     return response;
  //   } catch (error) {
  //     console.log(error);
  //   }
  // }

  // get patient details
  async getPatient(id) {
    try {
      const response = await new Promise((resolve, reject) => {
        const query = `SELECT 
              patient.patient_id AS ID,
              patient.name as Name,
              patient.gender as Gender,
              DATE_FORMAT(dob,'%Y-%m-%d') AS DOB,
              DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(), patient.dob)),
                      '%Y') + 0 AS Age,
              phone_number AS Contact
          FROM
              patient
          WHERE
              patient.patient_id = ${id};`;

        connection.query(query, (err, results) => {
          if (err) reject(new Error(err.message));
          resolve(results);
        });
      });

      return response;
    } catch (error) {
      console.log(error);
    }
  }

  // get patient data/reports
  async getPatientReport(id) {
    try {
      const response = await new Promise((resolve, reject) => {
        const query = `SELECT 
              DATE_FORMAT(flat_cdm_summary.encounter_datetime,
                      '%Y-%m-%d') AS 'Encounter Date',
              location.name AS Location,
              (CASE
                  WHEN flat_cdm_summary.htn_status = 7285 THEN 'New'
                  WHEN flat_cdm_summary.htn_status = 7286 THEN 'Known'
                  ELSE NULL
              END) AS 'Hypertension Status',
              (CASE
                  WHEN flat_cdm_summary.dm_status = 7281 THEN 'New'
                  WHEN flat_cdm_summary.dm_status = 7282 THEN 'Known'
                  ELSE NULL
              END) AS 'Diabetic Status'
          FROM
              patient
                  INNER JOIN
              flat_cdm_summary ON patient.patient_id = flat_cdm_summary.patient_id
                  INNER JOIN
              location ON location.id = flat_cdm_summary.location_id
          WHERE
              patient.patient_id = ${id};`;

        connection.query(query, (err, results) => {
          if (err) reject(new Error(err.message));
          resolve(results);
        });
      });

      return response;
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = DbService;
