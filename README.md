# CDM project

## This is a node rest api consuming a MySQL database.

Deployed on https://cdm-api.clementnzau.com/

Routes include:

- /patients
- /patients?search_name={name}
- /patients/:id
- /patients/:id/reports
- /reports
- /reports/patients?category={category}&l_id={id}&month={month}

### Note:

To search for patients ensure to have `search_name` as the query parameter variable.

i.e

```
/patients?search_name= 100
/patients?search_name=ient 10
/patients?search_name=patient 1
```

otherwise your response will get all patients details.

- White spaces will be applied in the search.

To get a particular patients reports pass the patient's :id

Example for a patient with id of 3

```
/patients/3/reports
```

To generate a CDM Monthly Report for all locations grouped by month and for all categories use

```
/reports
```

To get the patients list for a particular category in a specified month :

1. Categories passed can only be 'ndp', 'kdp', 'nhp' or 'khp' or 'hdp' and using the name key `category`.

- `ndp` - New Diabetic Patient
- `kdp` - Known Diabetic Patient
- `nhp` - New Hypertensive Patient
- `khp` - Known Hypertensive Patient
- `hdp` - Hypertensive and Diabetic Patients

2. Location id is passed as querry parameter using the name key `l_id`
3. Month passed as querry parameter using the name key `month` and should be in `YYYY-mm` formart.

```
/reports/patients?category=hdp&l_id=84&month=2021-05
```

For the Environment variables, have a .env file then replace the '' with your values

```
PORT=''
HOST=''
DB_PORT=''
DATABASE=''
USER=''
PASSWORD=''
```
