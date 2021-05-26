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

  // get CDM monthly report
  async getReports() {
    try {
      const response = await new Promise((resolve, reject) => {
        const query = `SELECT 
              location.id AS LID,
              DATE_FORMAT(encounter_datetime, '%Y-%m') AS Month,
              location.name AS Location,
              COUNT(CASE
                  WHEN htn_status = 7285 THEN 1
              END) AS 'New Hypertensive',
              COUNT(CASE
                  WHEN htn_status = 7286 THEN 1
              END) AS 'Known Hypertensive',
              COUNT(CASE
                  WHEN dm_status = 7281 THEN 1
              END) AS 'New Diabetic',
              COUNT(CASE
                  WHEN dm_status = 7282 THEN 1
              END) AS 'Known Diabetic',
              COUNT(CASE
                  WHEN
                      (dm_status = 7281 OR dm_status = 7282)
                          AND (htn_status = 7285 OR htn_status = 7286)
                  THEN
                      1
              END) AS 'Hypertensive and Diabetic'
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
    const { category, month, l_id } = args[0];

    const condition = (ct) => {
      switch (ct) {
        case 'ndp':
          return 'AND dm_status = 7281';
          break;
        case 'kdp':
          return 'AND dm_status = 7282';
          break;
        case 'nhp':
          return 'AND dm_status = 7285';
          break;
        case 'khp':
          return 'AND dm_status = 7286';
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
        patient.patient_id as PID, 
        patient.name AS Name, 
        DATE_FORMAT(flat_cdm_summary.encounter_datetime,'%Y-%m-%d') as 'Encounter Date', 
        location.name as Location, 
        SUBSTRING(patient.gender, 1, 1) as Gender,
        (CASE
            WHEN flat_cdm_summary.htn_status = 7285 THEN "New"
            WHEN flat_cdm_summary.htn_status = 7286 THEN "Known"
            ELSE null
        END) as 'Hypertension Status',
        (CASE
            WHEN flat_cdm_summary.dm_status = 7281 THEN "New"
            WHEN flat_cdm_summary.dm_status = 7282 THEN "Known"
            ELSE null
        END) as 'Diabetic Status',
        DATE_FORMAT(FROM_DAYS(DATEDIFF(now(),patient.dob)), '%Y')+0 as Age
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
