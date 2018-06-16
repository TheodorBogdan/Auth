const express = require('express');
const fs = require('fs')
const mysql = require('mysql');

const appSettings = JSON.parse(fs.readFileSync('./appSettings.json'))

const connection = mysql.createConnection({
    host: appSettings.host,
    user: appSettings.dbUser,
    password: appSettings.dbPassword,
    database: 'DemoAppStore'
});


const app = express();

app.use(express.json());

app.get('api/v1/collection/:id',(request, response) => {

    const sqlQuery = 'Select p.Id,p.Name,p.ImagePath,p.Path,p.Price '+
                    'From Product p, CustomerOrderProducts op, CustomerOrder o '+
                    'Where p.Id = op.ProductId and op.CustomerOrderId = o.Id and o.Id = ? '+
                    'And o.State = 1';
    connection.query(sqlQuery,
                [request.params.id],
            (err,result) => {
                var products = new Array();
                results.forEach(row => {
                    var product = {};
                    product.Id = row.Id;
                    product.Name = row.Name;
                    product.Path = row.Path;
                    product.ImagePath = row.ImagePath;
                    product.Price = row.Price;
                    products.push(product);
                });
                console.log(products);
                response.send(JSON.stringify(products));
            });
})


const port = process.env.PORT || 9090;

app.listen(port, ()=>{
    console.log('listening on port '+ port);
})