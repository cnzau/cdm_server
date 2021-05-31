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
              patient.patient_id AS id,
              patient.name AS name,
              SUBSTRING(patient.gender, 1, 1) AS gender,
              DATE_FORMAT(patient.dob, '%Y-%m-%d') AS dob,
              DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(), patient.dob)),
                      '%Y') + 0 AS age,
              patient.phone_number AS contact,
              DATE_FORMAT(patient.date_created, '%Y-%m-%d') AS date_created
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
              patient.patient_id AS id,
              patient.name as name,
              patient.gender as gender,
              DATE_FORMAT(dob,'%Y-%m-%d') AS dob,
              DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(), patient.dob)),
                      '%Y') + 0 AS age,
              phone_number AS contact
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
                      '%Y-%m-%d') AS encounter_date,
              location.name AS location,
              (CASE
                  WHEN flat_cdm_summary.htn_status = 7285 THEN 'New'
                  WHEN flat_cdm_summary.htn_status = 7286 THEN 'Known'
                  ELSE NULL
              END) AS hypertension_status,
              (CASE
                  WHEN flat_cdm_summary.dm_status = 7281 THEN 'New'
                  WHEN flat_cdm_summary.dm_status = 7282 THEN 'Known'
                  ELSE NULL
              END) AS diabetes_status
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

  // get CDM monthly report
  async getReports() {
    try {
      const response = await new Promise((resolve, reject) => {
        const query = `SELECT 
              location.id AS id,
              DATE_FORMAT(encounter_datetime, '%Y-%m') AS month,
              location.name AS location,
              COUNT(CASE
                  WHEN htn_status = 7285 THEN 1
              END) AS new_hypertensive,
              COUNT(CASE
                  WHEN htn_status = 7286 THEN 1
              END) AS known_hypertensive,
              COUNT(CASE
                  WHEN dm_status = 7281 THEN 1
              END) AS new_diabetic,
              COUNT(CASE
                  WHEN dm_status = 7282 THEN 1
              END) AS known_diabetic,
              COUNT(CASE
                  WHEN
                      (dm_status = 7281 OR dm_status = 7282)
                          AND (htn_status = 7285 OR htn_status = 7286)
                  THEN
                      1
              END) AS hypertensive_and_diabetic
          FROM
              testDB.location
                  INNER JOIN
              testDB.flat_cdm_summary ON location.id = flat_cdm_summary.location_id
          GROUP BY location_id , DATE_FORMAT(encounter_datetime, '%Y-%m')`;

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

  // get a category's patient list
  async getCategorysPatientList(...args) {
    const { category, l_id, month } = args[0];

    const condition = (ct) => {
      switch (ct) {
        case 'ndp':
          return 'AND dm_status = 7281';
          break;
        case 'kdp':
          return 'AND dm_status = 7282';
          break;
        case 'nhp':
          return 'AND htn_status = 7285';
          break;
        case 'khp':
          return 'AND htn_status = 7286';
          break;
        case 'hdp':
          return 'AND (dm_status = 7281 OR dm_status = 7282) AND (htn_status = 7285 OR htn_status = 7286)';
          break;
        default:
          break;
      }
    };

    try {
      const response = await new Promise((resolve, reject) => {
        const query = `SELECT 
        patient.patient_id as id, 
        patient.name AS name, 
        DATE_FORMAT(flat_cdm_summary.encounter_datetime,'%Y-%m-%d') as encounter_date, 
        location.name as location, 
        SUBSTRING(patient.gender, 1, 1) as gender,
        (CASE
            WHEN flat_cdm_summary.htn_status = 7285 THEN "New"
            WHEN flat_cdm_summary.htn_status = 7286 THEN "Known"
            ELSE null
        END) as hypertension_status,
        (CASE
            WHEN flat_cdm_summary.dm_status = 7281 THEN "New"
            WHEN flat_cdm_summary.dm_status = 7282 THEN "Known"
            ELSE null
        END) as diabetes_status,
        DATE_FORMAT(FROM_DAYS(DATEDIFF(now(),patient.dob)), '%Y')+0 as age
        FROM patient 
        inner join flat_cdm_summary on patient.patient_id=flat_cdm_summary.patient_id 
        inner join location on location.id=flat_cdm_summary.location_id
        WHERE DATE_FORMAT(encounter_datetime,'%Y-%m')='${month}'
         AND location.id=${l_id} ${condition(category)}`;
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
