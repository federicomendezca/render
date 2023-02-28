const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
mongoose.set('strictQuery', true);  //  Apago un warning
const _ = require("lodash");
const app = express();
const date = require(__dirname + "/date.js");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", { useNewUrlParser: true });
mongoose.connect("mongodb+srv://federicomendezca:Mustaine391an191131@cluster0.tqebvfy.mongodb.net/todolistDB", { useNewUrlParser: true });



//  Creo Schema de items
const itemsSchema = new mongoose.Schema({
    name: String
});
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
    name: "Welcome to your todolist!",
});
const item2 = new Item({
    name: "Hit the + button to add a new item",
});
const item3 = new Item({
    name: "<-- Hit this to delete an item",
});

const defaultItems = [item1, item2, item3];

//  Creo Schema de listas de items
const listSchema = {
    name: String,
    items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);

let workItems = []
app.get("/", function (req, res) {

    Item.find({}, function (err, foundItems) {

        if (foundItems.length === 0) {
            Item.insertMany([item1, item2, item3], function (err) {  // callback para posibles errores 
                if (err) {
                    console.log(err)
                } else {
                    console.log("Succesfully saved all items")
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItems: foundItems
            });
        };
    });
});

app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList){
        if (!err) {

            if (!foundList) {
                //  Si la lista no existe, la agrego como un nuevo documento a mi colección.
                console.log("Doesn't exist");
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();

                res.redirect("/" + customListName);
            } else {
                //  Si la lista existe, renderizo la página "list", y muestro la lista
                //  con el nombre que el usuario usó como input
                console.log("Exists!");
                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items
                });
            }
        }
    });
});


app.get("/about", function (req, res) {
    res.render("about");
});

app.post("/", function (req, res) {
    const itemName = req.body.newItem;  // Input del usuario
    const listName = req.body.list;
    //  Paso el input del usuario como valor para el nombre a mi colección de items
    const item = new Item({
        name: itemName,
    });

    if (listName === "Today"){
        //  Guardo el item en la database
        item.save();
        //  Refresheo la página
        res.redirect("/");
    } else {
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName)
        });
    }
});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;  // id del elemento
    const listName = req.body.listName;

    if (listName === "Today"){
        Item.findByIdAndRemove(checkedItemId, function(err){
            if (err){
                console.log(err);
            } else {
                console.log("Succesfuly deleted the document");
                res.redirect("/");
            };
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
            if (!err){
                res.redirect("/" + listName);
            }
        })
    }
    
    
});

/* app.listen(3000, function () {
    console.log("Server is up on port 3000")
}); */

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
};

app.listen(port, function(){
    console.log("Server is up succesfully")
});