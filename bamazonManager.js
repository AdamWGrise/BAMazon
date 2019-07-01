// Below: Required packages.
var mysql = require("mysql");
var inquirer = require("inquirer");
var cTable = require("console.table");

// Some global variables for managers.
var validItems = [];
var depts = [];
var currentUser = '';

// MySQL connection
var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: 'root',
    password: '&r*@ZbWHu*6aa%O25mAy',
    database: 'bamazon'
});

// Connect, then validate user.
connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected as ID " + connection.threadId);
    console.log("Welcome to the BAMazon dashboard, manager.")
    validate();
});

// Function that confirms a user in the DB before going any further.
function validate() {
    connection.query("SELECT * FROM users;",
        function (err, res) {
            if (err) throw err;
            inquirer.prompt([{
                    type: "input",
                    name: "username",
                    message: "\nEnter your manager username: ",
                },
                {
                    type: "password",
                    name: "password",
                    message: "\nEnter your password: ",
                    mask: "*"
                }
            ]).then(function (answers) {
                for (i = 0; i < res.length; i++) {
                    if (answers.username === res[i].username && answers.password === res[i].accessKey) {
                        currentUser = res[i].username;
                        readAllData();
                        return;
                    };
                };
                connection.end();
                console.log("\n\nIncorrect username or password. Please try again.\n\n");
                process.exit();
            });
        });
};

// This function lets the manager select an item and specify a quantity to restock.
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
    ]).then(function (answers) { // Obligatory input validation.
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
        console.log('\n\n');
        tableValues = [];
        var tableRow = [];
        validItems = [];
        for (i = 0; i < res.length; i++) {
            tableRow = [];
            tableRow.push(res[i].item_id, res[i].product_name, res[i].department_name, res[i].price, res[i].stock_quantity);
            tableValues.push(tableRow);
            validItems.push(res[i].item_id);
        };
        console.table(['Item ID','Product Name','Department','Price','Stock'], tableValues);
        console.log('\n');
        menu();
    });
};

// Function that returns items with fewer than 5 in stock remaining. 5 can be changed whenver the function is run, but 5 is the default.
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

// Lengthy function that lets the manager add a new product to the system.
function addNewProduct() {
    getDepts();
    inquirer.prompt([{
        type: "input",
        name: "product_name",
        message: "\nEnter the name of the new item you'd like to add to the inventory."
    },
    {
        type: "list",
        name: "department_name",
        message: "\nWhich department will this be under?",
        choices: depts
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

// This function is run whenever a new item is going to be added to the catalog. It gets all of the available departments for the manager to select from.
function getDepts() {
    connection.query("SELECT * FROM departments;",
        function (err, res) {
            if (err) throw err;
            if (depts.length === 0) {
                for (i = 0; i < res.length; i++) {
                    depts.push(res[i].department_name);
                };
            };
        });
};

// Menu for manager role.
function menu() {
    inquirer.prompt({
        type: "list",
        name: "selection",
        message: "\nPlease select an action, " + currentUser + ".",
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

// Exit app function.
function exitDashboard() {
    connection.end();
    console.log("\n\nClosing manager session...\n\n");
    process.exit();
};