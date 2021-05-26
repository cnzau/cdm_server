const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const dbService = require('./dbService');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) =>
  res.json({ msg: 'Chronic Disease Management system' })
);

// Get patients or search by ? search_name
app.get('/patients', (request, response) => {
  const db = dbService.getDbServiceInstance();

  const result = db.getAllPatients({ ...request.query });

  result
    .then((data) => response.json({ data: data }))
    .catch((err) => console.log(err));
});

// app.get('/patients/search/:name', (request, response) => {
//   const { name } = request.params;
//   const db = dbService.getDbServiceInstance();

//   const result = db.searchByName(name);

//   result
//     .then((data) => response.json({ data: data }))
//     .catch((err) => console.log(err));
// });

// get a patient's data
app.get('/patients/:id', (request, response) => {
  const { id } = request.params;
  const db = dbService.getDbServiceInstance();

  const result = db.getPatient(id);

  result
    .then((data) => response.json({ data: data }))
    .catch((err) => console.log(err));
});

// get a patient's reports
app.get('/patients/:id/reports', (request, response) => {
  const { id } = request.params;
  const db = dbService.getDbServiceInstance();

  const result = db.getPatientReport(id);

  result
    .then((data) => response.json({ data: data }))
    .catch((err) => console.log(err));
});

// get CDM monthly reports for all categories
app.get('/reports', (request, response) => {
  const db = dbService.getDbServiceInstance();

  const result = db.getReports();

  result
    .then((data) => response.json({ data: data }))
    .catch((err) => console.log(err));
});

// get patient list for specific category ? location & month
app.get('/reports/:category', (request, response) => {
  const db = dbService.getDbServiceInstance();

  const result = db.getCategorysPatientList({
    ...request.params,
    ...request.query,
  });

  result
    .then((data) => response.json({ data: data }))
    .catch((err) => console.log(err));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port: ${PORT}`));
