var mysql = require("mysql");
var inquirer = require("inquirer");
var validItems = [];

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: 'root',
    password: '&r*@ZbWHu*6aa%O25mAy',
    database: 'bamazon'
});


////////// INITIAL CONNECTION & INVENTORY FUNCTION ///////////
connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected as ID " + connection.threadId);
    console.log("Welcome to the BAMazon dashboard, <insert Manager name here>.")
    readAllData();
});
//////////////////////////////////////////////////////////////

function restockItems() {
    inquirer.prompt([{
            type: "input",
            name: "item",
            message: "\nEnter the item number for the product you'd like to restock."
        },
        {
            type: "input",
            name: "qty",
            message: "\nAlright, now tell us how many you'd like to get to restock.",
        }
    ]).then(function (answers) {
        if (answers.item != parseInt(answers.item, 10)) {
            console.log('Make sure you enter a NUMBER for the Item number. You can find the Item number in the listings if you choose "Show inventory" from the menu.');
            menu();
        } else if (answers.qty != parseInt(answers.qty, 10)) {
            console.log('Make sure you enter a NUMBER for the quantity of items you want to restock.');
            menu();
        } else if (!validItems.includes(parseInt(answers.item, 10))) {
            console.log('You need to pick an Item number from an item that is currently in the inventory. Select "Show inventory" again if you need a refresher.');
            menu();
        } else {
            connection.query("UPDATE products SET stock_quantity = stock_quantity + " + answers.qty + " WHERE ?;", {
                    item_id: answers.item
                },
                function (err, res) {
                    if (err) throw err;
                    console.log("\nItem restocked!\n");
                    menu();
                });
        };
    });
};

function readAllData() {
    connection.query("SELECT * FROM products;",
        function (err, res) {
            if (err) throw err;
            validItems = [];
            for (i = 0; i < res.length; i++) {
                console.log('\n' + res[i].item_id + ': "' + res[i].product_name + '", in ' + res[i].department_name);
                console.log('  $' + res[i].price + ' each  |  ' + res[i].stock_quantity + ' in stock');
                validItems.push(res[i].item_id);
            };
            console.log('\n');
            menu();
        });
};

function viewLowInventory() {
    inquirer.prompt({
        type: "input",
        name: "numberRemaining",
        message: "\nBy default, this will show you products where there are fewer than 5 left. Enter a number here if you want it to be something other than 5 - just hit Enter otherwise."
    }, ).then(function (answer) {
        if (answer.numberRemaining != parseInt(answer.numberRemaining, 10) || answer.numberRemaining === null) {
            answer.numberRemaining = 5;
        };
        console.log("\n\n\nThere are currently fewer than " + answer.numberRemaining + " of the following items in stock:")

        connection.query("SELECT * FROM products WHERE stock_quantity < " + answer.numberRemaining + ";",
            function (err, res) {
                if (err) throw err;
                for (i = 0; i < res.length; i++) {
                    console.log('\n' + res[i].item_id + ': "' + res[i].product_name + '", ' + res[i].stock_quantity + ' in stock');
                };
                console.log('\n\n');
                menu();
            });
    });
};

function addNewProduct() {
    inquirer.prompt([{
            type: "input",
            name: "product_name",
            message: "\nEnter the name of the new item you'd like to add to the inventory."
        },
        {
            type: "input",
            name: "department_name",
            message: "\nWhich department will this be under? E.g., Clothing, Books, Tools & Home Improvement, Movies, Video Games, Electronics, etc.",
        },
        {
            type: "input",
            name: "price",
            message: "\nWhat will be the price per unit for this item? Enter as numbers and a decimal place only.",
        },
        {
            type: "input",
            name: "stock_quantity",
            message: "\nHow many of this item to stock initially? Enter a whole number.",
        }
    ]).then(function (answers) {
        if (answers.price != parseFloat(answers.price, 10)) {
            console.log('\n\nERROR: Ensure you enter a number in decimal form for the price.\n');
            menu();
        } else if (answers.stock_quantity != parseInt(answers.stock_quantity, 10)) {
            console.log('\n\nERROR: Make sure you enter a whole number for the quantity of items you want to stock.\n');
            menu();
        } else {
            connection.query("INSERT INTO products (product_name, department_name, price, stock_quantity) VALUES ('" + answers.product_name + "','" + answers.department_name + "','" + parseFloat(answers.price) + "','" + parseInt(answers.stock_quantity) + "');",
                function (err, res) {
                    if (err) throw err;
                    console.log("\n\n\nItem added! Check the inventory again to see the new item.\n");
                    menu();
                });
        };
    });
};

function menu() {
    inquirer.prompt({
        type: "list",
        name: "selection",
        message: "\nPlease select an action.",
        choices: ["Show inventory", "View low inventory", "Restock an item", "Add a new product", "Exit"]
    }).then(function (answers) {
        if (answers.selection === "Show inventory") {
            readAllData();
        } else if (answers.selection === "View low inventory") {
            viewLowInventory();
        } else if (answers.selection === "Restock an item") {
            restockItems();
        } else if (answers.selection === "Add a new product") {
            addNewProduct();
        } else {
            exitDashboard();
        }
    });
};

function exitDashboard() {
    connection.end();
    console.log("\n\nClosing manager session...\n\n");
    process.exit();
};