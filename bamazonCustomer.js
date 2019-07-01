// Below: Required packages.
var mysql = require("mysql");
var inquirer = require("inquirer");
var cTable = require("console.table");

// Some global variables for customers.
var validItems = [];
var tableValues = [];
var fails = 0;
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
                    message: "\nEnter your customer username: ",
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

// Returns a listing of all products using console.table.
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

// Main menu. Kicks you out if you have continually put in letters or symbols where only numbers should go, tried to buy too many of an item, etc.
function menu() {
    if (fails > 4) {
        console.log("\n\n\n\n\n\n\n\n===================================\nYeah... you know what, " + currentUser + "? You've had so many issues just reading and typing coherently that I'm pretty sure you should step away from the computer and stop buying stuff. Come back tomorrow now, y'hear?");
        connection.end();
        process.exit();
    }
    inquirer.prompt({
        type: "list",
        name: "selection",
        message: "\nWhat would you like to do, " + currentUser + "?",
        choices: ["Show me the catalog again.", "Buy somethin'!", "I'm done. Time to go."]
    }).then(function (answers) {
        if (answers.selection === "Show me the catalog again.") {
            readAllData();
        } else if (answers.selection === "Buy somethin'!") {
            askCustomer();
        } else {
            endShoppingDay();
        }
    });
}

// Gets purchasing information from the customer: The item and quantity.
function askCustomer() {
    inquirer.prompt([{
            type: "input",
            name: "productNo",
            message: "\nEnter the Item number of the item you'd like to purchase.\n "
        },
        {
            type: "input",
            name: "qty",
            message: "\nHow many would you like to buy?\n"
        }
        // Some input validation before attempting the purchase, including integers for the product number and quantity, and also validating that the entered product number is actually a value in the current catalogue.
    ]).then(function (answers) {
        if (answers.productNo != parseInt(answers.productNo, 10)) {
            console.log('Make sure you enter a NUMBER for the Item number. You can find the Item number in the listing above!');
            fails++;
            menu();
        } else if (answers.qty != parseInt(answers.qty, 10)) {
            console.log('Make sure you enter a NUMBER for the quantity of items you want to purchase!');
            fails++;
            menu();
        } else if (!validItems.includes(parseInt(answers.productNo, 10))) {
            console.log('You need to pick an Item number from an item in the listings!');
            fails++;
            menu();
        } else {
            buyItem(answers.productNo, answers.qty);
        };
    });
};

// Checks the DB to see if the item is in stock; if there aren't any, give an error message. If there aren't enough of the item, give an option to buy out the remainder. Otherwise continue to purchase as usual. 
function buyItem(productNo, qty) {
    connection.query("SELECT * FROM products WHERE ?", {
            item_id: productNo
        },
        function (err, res) {
            if (err) throw err;
            if (res[0].stock_quantity === 0) {
                outOfStock(res[0]);
                console.log("\nI'm sorry; '" + res[0].product_name + "' is completely out of stock. Feel free to purchase something else or wait until we've restocked!\n");
                fails++;
                menu();
            } else if (qty > res[0].stock_quantity) {
                buyOut(qty, res[0]);
            } else {
                completePurchase(qty, res[0]);
            }
        });
};

// Only runs if there aren't enough of an item for a purchase to happen. Just gives the customer the option to get the remaining stock.
function buyOut(qty, item) {
    fails++;
    inquirer.prompt([{
        type: "confirm",
        name: "buyOut",
        message: "\nSorry, there aren't enough of those in stock for you to purchase " + qty + '! Would you like to purchase all of the remaining stock (' + item.stock_quantity + ')?\n'
    }]).then(function (answers) {
        if (answers.buyOut) {
            completePurchase(item.stock_quantity, item);
        } else {
            menu();
        }
    });
}

// Now we finalize the purchase, updating the database with an UPDATE statement and also logging out a receipt for the customer.
function completePurchase(qty, item) {
    connection.query("UPDATE products SET ? WHERE ?", [{
                stock_quantity: item.stock_quantity - qty,
                product_sales: item.product_sales + (qty * item.price)
            },
            {
                item_id: item.item_id
            }
        ],
        function (err, res) {
            if (err) throw err;
            var subtotal = Math.floor((qty * item.price) * 100) / 100;
            var tax = Math.floor((qty * item.price * 0.07125) * 100) / 100;
            var total = Math.floor((qty * item.price * 1.07125) * 100) / 100;;
            console.log("\n\n\nThanks for your purchase! Here's your receipt.");
            console.log("\n\n###############################\n\nItem: " + item.product_name +
                '\nQuantity: ' + qty +
                '\n\n-------------------------------' +
                '\nSubtotal: $' + subtotal +
                '\nTax: $' + tax +
                '\n\n===============================' +
                '\nTOTAL: $' + total + '\n\n###############################\n\n');
            menu();
        });
};

// Function to exit the app.
function endShoppingDay() {
    connection.end();
    console.log("\n\nThanks for stopping by! Have a lovely day.\n\n");
    process.exit();
};