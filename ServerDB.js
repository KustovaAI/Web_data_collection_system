var fs = require("fs");

var express = require("express");
var app = express();
var connection = require("./db");
var cors = require('cors');
app.use(cors());
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var globalName=[];

var curFile = '';
fs.readdir("./configure", function(err, items) {
    curFile = items[0];
    console.log(curFile);
});


app.post("/image",function(req,res){
    console.log("POST /autorization called");
    res.end(JSON.stringify("recieved image"));

});

app.post("/autorization",function(req,res){
    console.log("POST /autorization called");
    connection.query("select user_login from my_users where user_login = ?",req.body.user_login, function(err, rows) {
        if (err) {
            console.log(err);
            return;
        }
        if (rows != '') {
            connection.query("select password from my_users where user_login = ? and password = ?", [req.body.user_login, req.body.password], function (err, rows) {
                if (err) {
                    console.log(err);
                    return;
                }
                if (rows != '') {
                    res.end(JSON.stringify(req.body.user_login));
                    console.log("ok");
                } else {
                    res.end(JSON.stringify("incorrect password"));
                }

            });
        } else {
            res.end(JSON.stringify("no such user"));
        }
    });

});

app.post("/registration",function(req,res){
    console.log("POST /registration called");
    var ok = 0;
    connection.query("select user_login from my_users where user_login = ?",req.body.user_login, function(err, rows) {
        if (err) {
            console.log(err);
            return;
        }
        if (rows == "") {
            connection.query("insert into my_users values(?, ?)", [req.body.user_login, req.body.password], function (err, rows) {
                if (err) {
                    console.log(err);
                    return;
                }
                res.end(JSON.stringify(req.body.user_login));
            });
        } else {
            res.end(JSON.stringify("user already exist"));
        }
    });

});

app.get("/all_meters",function(req,res){
    console.log("GET /all_maters called");
    connection.query("select * from my_meters", function(err, rows){
        if (err){
            console.log(err);
            return;
        }
        res.end(JSON.stringify(rows));
    });

});

app.put("/add", function(req,res){
    console.log("PUT /add called");
    var d = new Date();
    var str = "insert into my_meters values (";
    var curr_date = d.getDate();
    var curr_month = d.getMonth() + 1;
    var curr_year = d.getFullYear();
    var curr_hour = d.getHours();
    var curr_min = d.getMinutes();
    var full_date = (curr_date + "-" + curr_month + "-" + curr_year + "T" + curr_hour+ ":" + curr_min).toString();
    str += '"';
    str += full_date;
    str += '", ';
    for(var i = 0; i < req.body.length; i++) {
        str += req.body[i];
        if (i != req.body.length - 1) str += ", "
    }
    str+=")";
    connection.query(str, function(err, rows){
        if (err){
            console.log(err);
            return;
        }
        res.end(JSON.stringify(rows));
    });
});

app.post("/user_meter",function(req,res){
    console.log("POST /user_meter called");
    connection.query("select * from my_meters where flat = ?",req.body.user, function(err, rows) {
        if (err){
            console.log(err);
            return;
        }
        res.end(JSON.stringify(rows));
    });

});

app.get("/default_file",function(req,res){
    console.log("GET /files called");
    str = "./configure/" + curFile;
    var json = require(str);
    res.end(JSON.stringify(json));
});

app.post("/change_config",function(req,res){
    console.log("POST /change_config called");
    globalName = [];
    globalCount = 0;
    path = './configure/';
    path += req.body;
    curFile = req.body;
    var json = require(path);
    parseColumns(json);
    str = "create table my_meters (date_of_meter varchar(30), "
    connection.query("drop table my_meters",function(err, rows) {
        if (err){
            console.log(err);
            return;
        }
    });
    for(var i = 0; i < globalName.length; i++) {
        str += globalName[i];
        if (i != globalName.length - 1) {
            str += " varchar(20), ";
        } else {
            str += " varchar(20), primary key ( date_of_meter, ";
        }
    }
    str += globalName[0];
    str += " ))";
    connection.query(str,function(err, rows) {
        if (err){
            console.log(err);
            return;
        }
    });
    res.end(JSON.stringify(json));
});

function parseSubColumns(data) {
    var keys = Object.keys(data);
    var counter = 0;
    for(var k in data) {
        if(counter>0) {
            globalName.push(keys[counter]);
        }
        counter+=1;
    }

}
function parseColumns(data) {
    var keys = Object.keys(data);
    globalName.push(keys[1]);
    for (var j in data.resources) {
        parseSubColumns(data.resources[j]);
    }
}

app.get("/list_config",function(req,res){
    console.log("GET /list_config called");
    fs.readdir("./configure", function(err, items) {
        res.end(JSON.stringify(items));
    });

});

app.listen(3000);