const express = require('express');
const fs = require('fs');
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

const port = process.env.PORT || 9090;

app.get('/api/v1/downloadproduct/:id',(request,response)=>{
    // fs.readFile('./icon.png', (err,data)=>{
    //     if(err){
    //         response.sendStatus(400);
    //     }
    //     response.end(data);
    // })
    connection.query('Select Path From Product Where Id = ?',
                    [request.params.id],
                    (err, result) => {
                        if(err){
                            response.sendStatus(400);
                        } else {
                            const path = result[0].Path;
                            const src = fs.createReadStream(path);
                            src.pipe(response);
                        }
                        
                    });

});

app.put('/api/v1/addproduct', (request, response) => {
    if (typeof (request.body.Name) === 'undefined' ||
        typeof (request.body.ImagePath) === 'undefined' ||
        typeof (request.body.Path) === 'undefined' ||
        typeof (request.body.Price) === 'undefined') {
        response.sendStatus(400);
        return;
    }
    connection.query('INSERT INTO Product(Name,ImagePath,Path,Price) VALUES(?,?,?,?)',
        [request.body.Name,
            request.body.ImagePath,
            request.body.Path,
            request.body.Price],
        (err, result) => {
            if (err) {
                console.error(err);
                response.sendStatus(400);
            }
            else{
                response.sendStatus(200);
            }
        }
    );

});

app.get('/api/v1/products', (request, response) => {
    connection.query("Select Id,Name,ImagePath,Path,Price From Product",
        (err, results) => {
            if(err){
                response.sendStatus(400);
            }
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
        }
    );
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});