# CDM project

## This is a node rest api consuming a MySQL database.

Deployed on https://cdm-api.clementnzau.com/

Routes include:

- /patients
- /patients?search_name=''
- /patients/:id
- /patients/:id/reports
- /reports
- /reports/category?l_id=''&month=''

Categories passed as parameters can only be 'ndp', 'kdp', 'nhp' or 'khp'.

Location Id is passed as querry parameter

Month passed as querry parameter should be in YYYY-mm formart.

For the Environment variables, have a .env file then replace the '' with your values

````PORT=''
HOST=''
DB_PORT=''3306''
DATABASE=''
USER=''test_user''
PASSWORD=''```
````
