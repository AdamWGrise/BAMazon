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

connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected as ID " + connection.threadId);
    readAllData();
});

function readAllData() {
    connection.query("SELECT * FROM products;",
        function (err, res) {
            if (err) throw err;
            for (i = 0; i < res.length; i++) {
                console.log('\nItem ' + res[i].item_id + ': ' + res[i].product_name);
                console.log('  in ' + res[i].department_name);
                console.log('  $' + res[i].price + '  |  ' + res[i].stock_quantity + ' in stock');
                validItems.push(res[i].item_id);
            };
            console.log('\n');
            askCustomer();
        });
};

function askCustomer() {
    inquirer.prompt([{
            type: "input",
            name: "productNo",
            message: "\nEnter the Item number of the item you'd like to purchase:\n "
        },
        {
            type: "input",
            name: "qty",
            message: "\nHow many would you like to buy?\n"
        }
    ]).then(function (answers) {
        if(answers.productNo != parseInt(answers.productNo,10)) {
            console.log('Make sure you enter a NUMBER for the Item number. You can find the Item number in the listing above!');
            tryAgain();
        } else if (answers.qty != parseInt(answers.qty,10)) {
            console.log('Make sure you enter a NUMBER for the quantity of items you want to purchase!');
            tryAgain();
        } else if (!validItems.includes(parseInt(answers.productNo,10))) {
            console.log('You need to pick an Item number from an item in the listings!');
            tryAgain();
        } else {
            buyItem(answers.productNo, answers.qty);
        };
    });
};

function tryAgain() {
    inquirer.prompt([{
        type: "confirm",
        name: "tryAgain",
        message: "\nPick something else to buy?\n"
    }]).then(function (answers) {
        if (answers.tryAgain) {
            askCustomer();
        } else {
            endShoppingDay();
        }
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
            } else if (qty > res[0].stock_quantity) {
                buyOut(qty, res[0]);
            } else {
                completePurchase(qty, res[0]);
            }
        });
};

// NEEDS TO BE TESTED
function outOfStock(item) {
    inquirer.prompt([{
        type: "confirm",
        name: "shopAgain",
        message: "\nI'm sorry; '" + item.product_name + "' is completely out of stock. Would you like to purchase something else?\n"
    }]).then(function (answers) {
        if (answers.shopAgain) {
            askCustomer();
        } else {
            endShoppingDay();
        }
    });
};

function buyOut(qty, item) {
    inquirer.prompt([{
        type: "confirm",
        name: "buyOut",
        message: "\nSorry, there aren't enough of those in stock for you to purchase " + qty + '! Would you like to purchase all of the remaining stock (' + item.stock_quantity + ')?\n'
    }]).then(function (answers) {
        if (answers.buyOut) {
            completePurchase(item.stock_quantity, item);
        } else {
            tryAgain();
        }
    });
}

function completePurchase(qty, item) {
    ///////// TEMP ////////////
    console.log("\n\n\nPurchase: " + item.product_name + '\nAmount purchased: ' + qty)
    // Do stuff to the DB here, refine purchase message.
    ///////////////////////////
    inquirer.prompt([{
        type: "confirm",
        name: "shopAgain",
        message: "\nAnything else you'd like to buy today?\n"
    }]).then(function (answers) {
        if (answers.shopAgain) {
            askCustomer();
        } else {
            endShoppingDay();
        }
    });
};

function endShoppingDay() {
    connection.end();
    console.log("\n\nThanks for stopping by! Have a lovely day.\n\n");
    process.exit();
}