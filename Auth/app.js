const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const mysql = require('mysql');
//const mssql = require("mssql");


const appSettings = JSON.parse(fs.readFileSync('./appSettings.json'))
const secretKey = appSettings.secretKey;
var issuer = appSettings.issuer;

// const pool = new mssql.ConnectionPool(appSettings.mssqlConnection);

// try{
//     pool.connect((err)=>{
//         console.log("err in callback" + err);
//     })
//     console.log('eh')
// }catch(err){
//     console.log(err);
// }
// async () => {
//     try {
//         const pool1 = await mssql.ConnectionPool(appSettings.mssqlConnection);

//     } catch (error) {
//         console.log(error)
//     }
// }

const connection = mysql.createConnection({
    host: appSettings.host,
    user: appSettings.dbUser,
    password: appSettings.dbPassword,
    database: 'DemoAppStore'
});
connection.connect();


const app = express();
app.use(express.json());


app.get('/api/v1/monitoring', (request, response) => {
    response.sendStatus(400); 
});

app.get('/api/v1/checktoken', (request, response) => {
    //Get auth header value
    const bearerHeader = request.headers['authorization'];
    //Check if bearer is undefined
    if (typeof (bearerHeader) !== 'undefined') {
        //split at space
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        jwt.verify(bearerToken, secretKey, (err, authData) => {
            if (err) {
                response.sendStatus(403);
            } else {
                response.sendStatus(200);
            }
        });
    }
    else {
        //Forbidden
        response.sendStatusendStatuss(403);
    }
});

// app.get('/api/v1/testsql', (req, res) => {
//     const r = new mssql.Request(pool);
//     r.query('Select 1 as number',(err,result)=>{
//         if(typeof(err) !== 'undefined'){
//             console.log(err)
//             res.send(err);
//         }
//         console.log(result)
//     })
//     // console.log('---------------')
//     // res.sendStatus(200);
// })

app.post('/api/v1/login', (request, response) => {
    //Mock User
    if (typeof (request.body.email) === 'undefined' ||
        typeof (request.body.password) === 'undefined') {
        response.sendStatus(400);
        return;
    }
    connection.query('select Customer.Claims from Customer where Customer.Email = ? and Customer.Password = ?',
        [request.body.email, request.body.password],
        (err, result) => {
            if (err) {
                console.error(err);
                response.sendStatus(400);
            }
            else {
                var claims = {
                    sub: request.body.email,
                    iis: issuer,
                    permissions: result
                }
                jwt.sign({ claims }, secretKey, { expiresIn: '3h' }, (err, token) => {
                    response.json({
                        token
                    })
                })
            }
        }
    );

});

// Format of TOKEN
// Authorization : Bearer <access_token>

//Verify token
function verifyToken(request, response, next) {
    //Get auth header value
    const bearerHeader = request.headers['authorization'];
    //Check if bearer is undefined
    if (typeof (bearerHeader) !== 'undefined') {
        //split at space
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        request.token = bearerToken;
        //Next middleware
        jwt.verify(request.token, secretKey, (err, authData) => {
            if (err) {
                response.sendStatus(403);
            }
        });
        next();
    }
    else {
        //Forbidden
        response.sendStatus(403);
    }

}

app.put('/api/v1/register',(request, response)=>{
        //Mock User
    if (typeof (request.body.Email) === 'undefined' ||
        typeof (request.body.Password) === 'undefined') {
        response.sendStatus(400);
        return;
    }
    const sqlQuery = 'INSERT IGNORE INTO Customer(Email, Password) VALUES(?,?);';
    connection.query(sqlQuery,
        [request.body.Email, request.body.Password],
        (err,result)=>{
            if(err){
                console.log(err);
                response.sendStatus(400);
            }else{
                response.sendStatus(200);
            }
        });
});

const port = process.env.PORT || 9090;
console.log(secretKey);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});