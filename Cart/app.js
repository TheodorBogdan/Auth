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
connection.connect();

const app = express();

app.use(express.json());

app.put('/api/v1/addtocart',(request, response)=>{
    console.log(request.body.ProductId);
    connection.query('CALL addProductToCustomerCart(?,?)',
                    [request.body.ProductId, request.body.CustomerId],
                (err,result)=>{
                    if(err){
                        console.log(err)
                        response.sendStatus(400);
                    }
                    response.sendStatus(200);
                });
});

app.delete('/api/v1/clearcart/:id',(request,response)=>{
    const sqlQuery = 'UPDATE CustomerOrder SET State = 2 WHERE CustomerId = ?'+
                    'AND State = 0';
    console.log(request.params.id);
    connection.query(sqlQuery,[request.params.id],(err,result)=>{

        if(err){
            response.sendStatus(400);
        }
        else{
            response.sendStatus(200);
        }
    });
});

app.get('/api/v1/activecart/:id',(request, response)=>{

    const sqlQuery = 'Select p.Id as id,p.Name as name,p.ImagePath as imagePath,p.Path as path,p.Price as price '+
        'From Product p, CustomerOrderProducts op, CustomerOrder o '+
        'Where p.Id = op.ProductId and op.CustomerOrderId = o.Id and o.Id = ?'+
        'And o.State = 0'; 
    console.log(request.params.id);
    connection.query(sqlQuery,
                [request.params.id],
            (err,result)=>{
                if(err){
                    console.log(err);
                    response.sendStatus(400);
                }
                var products = new Array();
                result.forEach(row => {
                    var product = {};
                    product.Id = row.id;
                    product.Name = row.name;
                    product.Path = row.path;
                    product.ImagePath = row.imagePath;
                    product.Price = row.price;
                    products.push(product);
                });
                console.log(products);
                response.send(JSON.stringify(products));
            });
})

app.put('/api/v1/buycart',(request,response)=>{
    const sqlQuery = 'update CustomerOrder set CustomerOrder.State = 1 where CustomerOrder.CustomerId = ? and CustomerOrder.State=0;'
    connection.query(sqlQuery,
        [request.body.Id],
    (err,result)=>{
        if(err){
            console.log(err)
            response.sendStatus(400);
        }
        response.sendStatus(200);
    });
});

const port = process.env.PORT || 9090;

app.listen(port, ()=>{
    console.log('listening on port '+ port);
})