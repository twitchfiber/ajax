var mysql = require("mysql");
var express = require("express");
var handlebars = require("express-handlebars").create({defaultLayout:'main'});
var bodyParser = require("body-parser");
var app = express();

app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static("public"));

var connection = mysql.createConnection({
    host  : 'classmysql.engr.oregonstate.edu',
    user  : 'cs290_lifr',
    password: '2268',
    database: 'cs290_lifr'
});

// CHECK IF CONNECTION SUCCEEDED
connection.connect(function(err) {
    if (err) {console.log("Unsuccessful connection")}
    else {console.log("Connected successfully to database")};
});

// first visit to site will query database for initial content
app.get("/", (req, res) => {
    res.render("home");
});

// handle SELECT
app.get("/get", (req, res) => {
    var context = {};
    var query = "SELECT * FROM todo";
    connection.query(query, (err, results) => {
        if (err) throw err;
        context.results = results;
        res.send(context);
    });
});

// handle INSERT
app.post("/insert", (req, res) => {
    var context = {};
    var q = "INSERT INTO todo SET ?";
    var select = "SELECT * FROM todo";
    var vals_to_insert = {
        name: req.body.name,
        reps: req.body.reps,
        weight: req.body.weight,
        unit: req.body.unit,
        date: req.body.date
    };
    connection.query(q, vals_to_insert, function(err, results) {
        if (err) throw err;
        connection.query(select, function(err, results) {
            if (err) throw err;
            // return last object
            res.send(results[results.length - 1]);
        });
    });
});

// handle EDIT
app.post("/edit", (req, res) => {
    console.log("/edit", req.body.id);
    // get the info from the db of the entry being edited
    var q = "SELECT * FROM todo WHERE id=?";
    connection.query(q, [req.body.id], (err, results) => {
        if (err) throw err;
        if (results.length == 1) {
            var curr_vals = results[0];
            var update = "UPDATE todo SET name=?, reps=?, weight=?, unit=?, date=? WHERE id=?";
            connection.query(update, [req.body.name || curr_vals.name,
            req.body.reps || curr_vals.reps,
            req.body.weight || curr_vals.weight,
            req.body.unit || curr_vals.unit,
            req.body.date || curr_vals.date,
            req.body.id],
            (err, results) => {
                if (err) throw err;
                var reselect = "SELECT * FROM todo WHERE id=?"
                connection.query(reselect, [req.body.id], (err, results) => {
                    if (err) throw err;
                    console.log(results);
                    console.log("Results I'm sending back to ajax caller", results);
                    res.send(results);
                });
            });
        };
    });
})

// handle DELETE
app.post("/delete", (req, res) => {
    var q = "DELETE FROM todo WHERE id = ?";
    var select = [req.body.id];
    connection.query(q, select, (err, results) => {
        if (err) throw err;
        res.send("Deleted!");
    });
});

// create/reset table shortcut - bad practice
app.get("/reset-table", (req, res) => {
    var context = {};
    connection.query("DROP TABLE IF EXISTS todo", (err) => {
        var createString = "CREATE TABLE todo(" +
        "id INT PRIMARY KEY AUTO_INCREMENT," +
        "name VARCHAR(255) NOT NULL," +
        "reps INT NOT NULL," +
        "weight INT NOT NULL," +
        "unit VARCHAR(255) NOT NULL," +
        "date DATE NOT NULL)";
        connection.query(createString, (err) => {
            console.log("Table reset");
            res.render("home");
        });
    });
});

app.listen(7878, () => {
    console.log("Server started");
});
