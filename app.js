//jshint esversion:6
require('dotenv').config(); //to secure private files
const express = require("express");   //to require express 
const bodyParser = require("body-parser"); // to require bodyparser
const mongoose = require("mongoose");   // to require mongoose which we install in our package.json
const _ = require("lodash");           // it is used to convert letters to lowercase or uppercase
const app = express();
const PORT = process.env.PORT || 3000; 

app.set('view engine', 'ejs');   //from ejs documentations of using ejs with express

app.use(bodyParser.urlencoded({ extended: true })); //middleware used for pre-process req
app.use(express.static("public")); // help to run css we need to put our css in public folder

mongoose.set('strictQuery', false);
//to made a connection with the running server which will run with mongod command

async function connectDB() {
    try {
       const conn = await mongoose.connect(process.env.MONGO_URI);
        
       console.log("MongoDB Connected: " + conn.connection.host);
 
    } catch(err) {
       
       console.log(err);
       process.exit(1);
    }
}

//Created Schema
const itemsSchema = new mongoose.Schema({
  name: String
});

//Created model
const Item = mongoose.model("Item", itemsSchema);

//Creating items
const item1 = new Item({
  name: "Welcome! What is for Today?"
});

const item2 = new Item({
  name: "Click + to add a new item."
});

const item3 = new Item({
  name: "Mark checkbox to delete an item."
});

//Storing items into an array
const defaultItems = [item1, item2, item3];

//created schema for new list 
const listSchema = {
  name: String,
  items: [itemsSchema]
}

//created model for new list
const List = mongoose.model("List", listSchema);

//In latest version of mongoose insertMany has stopped accepting callbacks
//instead they use promises
//So ".then" & "catch" are part of PROMISES IN JAVASCRIPT.

//PROMISES in brief
//In JS, programmers encountered a problem called "callback hell", where syntax of callbacks were cumbersome & often lead to more problems.
//So in effort to make it easy PROMISES were invented.

app.get("/", function (req, res) {
  //printing all store values in terminal (In my case Hyper Terminal)
  Item.find({}).then(foundItem => {
    if (foundItem.length === 0) {
      return Item.insertMany(defaultItems);
    } else {
      return foundItem;
    }
  })
    .then(savedItem => {
      res.render("list", { listTitle: "Today Work TO DO 🥵", newListItems: savedItem });
    })
    .catch(err => console.log(err));

});

// add new items to list and after adding it will redirect to home route
app.post("/", function (req, res) {

  const itemName = req.body.newItem;  //for default list
  const listName = req.body.list;    //for new list 
  const item = new Item({
    name: itemName
  });

  if (listName === "Today Work TO DO 🥵") {  // if item if from default list 
    item.save();
    res.redirect("/")
  } else {            // if item from new list then it will add to new list 
    List.findOne({ name: listName }).then(function (foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);   // redirect to new list not on default list
    })
  }
});

//to add new list like localhost:3000/home or /work
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(function (foundList) {

      if (!foundList) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        console.log("saved");
        res.redirect("/" + customListName);
      }
      else { //show existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    })
    .catch(function (err) { });

})

//deleting the items which are checked from the list as well as from database and then redirect to home route

app.post("/delete", function (req, res) {
  const checkedListName = req.body.listName;
  const checkedItemId = req.body.checkbox;

  if (checkedListName === "Today Work TO DO 🥵") {
    //In the default list
    del().catch(err => console.log(err));

    async function del() {
      await Item.deleteOne({ _id: checkedItemId });
      res.redirect("/");   // redirect to default list
    }
  } else {
    //In the custom list

    update().catch(err => console.log(err));

    async function update() {
      await List.findOneAndUpdate({ name: checkedListName }, { $pull: { items: { _id: checkedItemId } } });
      res.redirect("/" + checkedListName); // redirect to custom list
    }
  }

});
// server started on both localhost:3000 as well as on cloud port
connectDB().then( () => {
 
  app.listen(PORT, function() {
 
      console.log("Server started. Listening on port " + PORT);
  });
});