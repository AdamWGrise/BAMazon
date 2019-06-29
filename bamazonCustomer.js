var mysql = require("mysql");
var inquirer = require("inquirer");
var validItems = [];
var fails = 0;

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: 'root',
    password: '&r*@ZbWHu*6aa%O25mAy',
    database: 'bamazon'
});

connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected as ID " + connection.threadId);
    readAllData();
});

function readAllData() {
    connection.query("SELECT * FROM products;",
        function (err, res) {
            if (err) throw err;
            validItems = [];
            for (i = 0; i < res.length; i++) {
                console.log('\nItem ' + res[i].item_id + ': "' + res[i].product_name + '", in ' + res[i].department_name);
                console.log('  $' + res[i].price + ' each  |  ' + res[i].stock_quantity + ' in stock');
                validItems.push(res[i].item_id);
            };
            console.log('\n');
            menu();
        });
};

function menu() {
    if (fails > 4) {
        console.log("\n\n\n\n\n\n\n\n===================================\nYeah... you know what? You've had so many issues just reading and typing coherently that I'm pretty sure you should step away from the computer and stop buying stuff. Come back tomorrow now, y'hear?");
        connection.end();
        process.exit();
    }
    inquirer.prompt({
        type: "list",
        name: "selection",
        message: "\nWhat would you like to do?",
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

function completePurchase(qty, item) {
    connection.query("UPDATE products SET ? WHERE ?", [{
                stock_quantity: item.stock_quantity - qty
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

function endShoppingDay() {
    connection.end();
    console.log("\n\nThanks for stopping by! Have a lovely day.\n\n");
    process.exit();
};