// Below: Required packages.
var mysql = require("mysql");
var inquirer = require("inquirer");
var cTable = require("console.table");

// Some global variables for supervisors.
var tableValues = [];
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
    console.log("Welcome to the BAMazon dashboard, oh lordly supervisor.")
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
                    if (answers.username === res[i].username && answers.password === res[i].accessKey && res[i].security_role === 'Supervisor') {
                        currentUser = res[i].username;
                        menu();
                        return;
                    };
                };
                connection.end();
                console.log("\n\nIncorrect username or password. Please try again.\n\n");
                process.exit();
            });
        });
};

// Returns a listing of all products using console.table. Includes product sales for the supervisors.
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
                tableRow.push(res[i].item_id, res[i].product_name, res[i].department_name, res[i].price, res[i].stock_quantity, res[i].product_sales);
                tableValues.push(tableRow);
                validItems.push(res[i].item_id);
            };
            console.table(['Item ID','Product Name','Department','Price','Stock','Sales Total'], tableValues);
            console.log('\n');
            menu();
        });
};

// Menu for supervisor role.
function menu() {
    inquirer.prompt({
        type: "list",
        name: "selection",
        message: "\nPlease select an action, " + currentUser + ".",
        choices: ["Show inventory", "View product sales by department", "Create new department", "Exit"]
    }).then(function (answers) {
        if (answers.selection === "Show inventory") {
            readAllData();
        } else if (answers.selection === "View product sales by department") {
            viewDeptSales();
        } else if (answers.selection === "Create new department") {
            addNewDept();
        } else {
            exitDashboard();
        }
    });
};

// Groups together and totals all sales for every department, then determines profit by comparing revenue to the overhead.
function viewDeptSales() {
    connection.query("SELECT D.department_id AS 'id', D.department_name AS  'name', D.over_head_costs AS 'overhead', SUM(product_sales) AS 'sales', SUM(product_sales) - MAX(D.over_head_costs) AS 'profit' FROM  Products P INNER JOIN departments D ON D.department_name =  P.department_name GROUP BY D.department_id, D.department_name,  D.over_head_costs",
        function (err, res) {
            if (err) throw err;
            console.log('\n\n');
            tableValues = [];
            var tableRow = [];
            for (i = 0; i < res.length; i++) {
                tableRow = [];
                tableRow.push(res[i].id, res[i].name, res[i].overhead, res[i].sales, res[i].profit);
                tableValues.push(tableRow);
            };
            console.table(['Dept ID', 'Dept Name', 'Overhead', 'Sales', 'Profit'], tableValues);
            menu();
        });
};

// Option to add a new department, in the case of new products being added that aren't covered by the existing department options.
function addNewDept() {
    inquirer.prompt([{
            type: "input",
            name: "department_name",
            message: "\nWhat will be the name of the new department?",
        },
        {
            type: "input",
            name: "overhead",
            message: "\nIndicate the overhead costs of this new department.",
        },
    ]).then(function (answers) {
        if (answers.overhead != parseFloat(answers.overhead, 10)) {
            console.log('\n\nERROR: Ensure you enter a number in decimal form for the overhead costs.\n');
            menu();
        } else {
            connection.query("INSERT INTO departments (department_name, over_head_costs) VALUES ('" + answers.department_name + "','" + answers.overhead + "');",
                function (err, res) {
                    if (err) throw err;
                    console.log("\n\n\n" + answers.department_name + " department added with an overhead cost of " + answers.overhead + " Have your managers add some products to the catalog to begin tracking sales.\n");
                    menu();
                });
        };
    });
};

// Exit app function.
function exitDashboard() {
    connection.end();
    console.log("\n\nClosing supervisor session...\n\n");
    process.exit();
};