const express = require('express')
const mysql = require('mysql2')
const app = express()
const swaggerUi = require('swagger-ui-express')
const fs = require('fs')
const YAML = require('yaml')
const file = fs.readFileSync('./swagger.yaml','utf-8')
const swaggerDocument = YAML.parse(file)
const port = 3000

app.use('/api-docs' , swaggerUi.serve, swaggerUi.setup(swaggerDocument))

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'traval_app',
  });

app.get('/register', (req, res) => {
  connection.query(
    'SELECT * FROM register_account' , 
    function(err, results) {
        res.json(results)
    }
  )
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})