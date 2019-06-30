var mysql = require("mysql");
var inquirer = require("inquirer");
var cTable = require("console.table");
var validItems = [];
var tableValues = [];

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
    console.log("Welcome to the BAMazon dashboard, oh lordly supervisor.")
    menu();
});
//////////////////////////////////////////////////////////////

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

function menu() {
    inquirer.prompt({
        type: "list",
        name: "selection",
        message: "\nPlease select an action.",
        choices: ["Show inventory", "View product sales by department", "Create new department", "Exit"]
    }).then(function (answers) {
        if (answers.selection === "Show inventory") {
            readAllData();
        } else if (answers.selection === "View product sales by department") {
            viewDeptSales();
        } else if (answers.selection === "Create new department") {
            // createDept();
        } else {
            exitDashboard();
        }
    });
};

function viewDeptSales() {
    connection.query("SELECT D.department_id AS 'id', D.department_name AS  'name', D.over_head_costs AS 'overhead', SUM(product_sales) AS 'sales', SUM(product_sales) - MAX(D.over_head_costs) AS 'profit' FROM  Products P INNER JOIN departments D ON D.department_name =  P.department_name GROUP BY D.department_id, D.department_name,  D.over_head_costs",
        function (err, res) {
            if (err) throw err;
            console.log('\n\n');
            tableValues = [];
            var tableRow = [];
            for (i = 0 ; i < res.length ; i++) {
                tableRow = [];
                tableRow.push(res[i].id, res[i].name, res[i].overhead, res[i].sales, res[i].profit);
                tableValues.push(tableRow);
            };
            console.table(['Dept ID','Dept Name','Overhead','Sales','Profit'], tableValues);
            menu();
        });
};

function exitDashboard() {
    connection.end();
    console.log("\n\nClosing supervisor session...\n\n");
    process.exit();
};