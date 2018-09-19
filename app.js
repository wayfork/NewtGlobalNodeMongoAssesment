var express = require("express"); 
var bodyParser = require("body-parser");

var MongoClient = require('mongodb').MongoClient;
 
// Connection URL
var url = 'mongodb://localhost:27017';
 
// Database Name
var dbName = 'assesmentDB';

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var server = app.listen("3000",function(){
	console.log("\n ** Hi Newt Global **. \n\n!! Server started working !! \n\n  Open browser and go to http://localhost:3000 \n\n");
});

app.get("/",function(req,res){
	res.sendFile(__dirname+"/views/index.html");
});

app.post("/insertData",function(req,res){ // insert data
	var userName = req.body.name;
	var phone = req.body.phone;
	var address = req.body.address;
	var productName = req.body.productName;
	var productPrice = req.body.productPrice;
	var productDescription = req.body.productDescription;
	var quantity = req.body.quantity;
	
	MongoClient.connect(url, function(err, client) {
	  console.log("Mongodb Connection Established....");
	  var db = client.db(dbName);
	  
	  function insertTransactionData(db,products,userId){
		var price = products.productPrice * parseInt(quantity);
		db.collection("transactions").insertOne({"date":new Date(),"productId":products._id,"userId":userId,"productName":products.productName,"quantity":quantity,"price":price},function(err,transactionInserted){
			if (err) throw err;
			client.close();
			res.send("Data inserted");
		});
	  }
	  
	  function productdata(db,userId){
		  db.collection("products").find({"productName":productName}).toArray(function(err,products){
			if(products.length > 0){
				console.log("product exist: "+JSON.stringify(products[0]));
				insertTransactionData(db,products[0],userId);
			}else{
				db.collection("products").insertOne({"productName":productName,"productPrice": parseInt(productPrice),"description":productDescription}, function(err, productInserted) {
					if (err) throw err;
					console.log("productInserted : "+JSON.stringify(productInserted));
					if(productInserted){
						insertTransactionData(db,productInserted.ops[0],userId);
					}	
				});
			}
		  });
	  }
	  console.log("username : "+userName);
	  db.collection("users").find({"userName":userName}).toArray(function(err,user){
		if (err) throw err;
		console.log(JSON.stringify(user));
		if(user.length > 0){
		console.log("user exist");
			var userId = user[0]._id;
			productdata(db,userId);	
		}
		else{
			console.log("new user");
			db.collection("users").insertOne({"userName":userName,"phone":phone,"address":address}, function(err, userInserted) {
			console.log("userInserted: "+JSON.stringify(userInserted.ops[0]));
				if (err) throw err;
				if(userInserted){
					productdata(db,userInserted.ops[0]._id);
				}
		  });
		}
	  });
	});
});

app.post("/getData",function(req,res){ // get data
	MongoClient.connect(url, function(err, client) {
	  console.log("Mongodb Connection Established....");
	  var db = client.db(dbName);
	  
	  db.collection("transactions").aggregate([{$lookup:{from:"users",localField:"userId",foreignField:"_id",as:"userData"}},{$group:{_id:{userId:"$userId"},"transactionsData":{"$last":"$$ROOT"},totalTransactions:{$sum:1}}}]).toArray(function(err,data){
		if (err) throw err;
		client.close();
		if(data.length > 0)
			res.send({"status":"1","val":data});
		else
			res.send({"status":"0"});
	  });
	});
});

