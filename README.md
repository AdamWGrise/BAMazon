# BAMazon!
This application is a demonstration of having connectivity between a Node.js application and a data source. In this case, a MySQL database.

## What is this app?
This application is a retail shopping command line interface, where retail items in various departments can be listed and customers can make purchases. We have three ways of interacting with this system:
1. As a customer. When you go to a shopping site, you can log in using a username and password, then look at a catalog and make purchases - this is essentially what you can do with this application from this perspective.
2. As a manager. This is the user that would spend more time 'managing' the inventory system. They can re-stock inventory, get a list of items that are low in stock, add new products to the catalog, and view a list of recent transactions.
3. As a supervisor. From this perspective, it's more high-level; either new departments can be created (in anticipation of stocking new items that need a new category), or sales totals can be viewed.

## How does it work?
Node.js is running the application, while MySQL acts as the data source and repository.

The database currently consists of four tables that can be connected in various ways:
1. Products. This table stores all of the detailed information on each product in the catalog, including the number of them in stock, the price, and what department they belong to.
2. Departments. This is to have details on the departments, including the overhead costs of each department.
3. Users. Anyone using the application needs a user account; this table stores rudimentary data for each user (including a non-encrypted password) - but the essential idea is there to allow for users to have an account with their own access and details.
4. Transactions. Mostly used as a way of seeing recent activity.

Further, there are three Node packages used:
1. MySQL. Very straightforward, as this is needed for the connection to the MySQL database(s).
2. Inquirer. Lets the command line interface allow for more detailed and step-by-step inputs of various data types; this is used in every menu and occasion where user input is obtained.
3. ConsoleTable. Allows a visual listing of results from MySQL in the command line, displaying results as a table.

## Alright, so how is it used?
As a command line interface that requires a connection to MySQL, this code won't be usable on its own; but a demonstration video is available in the link at the bottom of this ReadMe.

In essence, there are three separate applications, one for each role (customer, supervisor, manager). In the command line, have Node run the one that's needed, and it'll ask for a username and password. As the user, you'll have likely supplied that information like anywhere else!

Then, it's very straightforward because Inquirer lets us insert menus and constraints that guide the user everywhere they go. Based on their selections and choices, different statements are run to the database.

1. Customer

   a) `Show catalog again` runs a simple SELECT statement on the Products table.
   
   b) `Buy somethin'!` allows selection of an item and a quantity to purchase. After validating the entered data, a check is made to see if the items are available. If there's no stock, it returns to the menu. If there's some stock but not as much as you want to order, you get the option to buy out what remains. Otherwise, it'll go straight to creating a row in the Transactions table (INSERT INTO), updating the Products table (UPDATE products SET x WHERE y), and giving the customer a receipt in the command line.
   
2. Supervisor

   a) `Show inventory` will display the catalog including total sales, just using another SELECT statement.
   
   b) `View product sales by department` uses a SELECT statement with a JOIN to the departments table from products. A total is obtained for each department and compared to its overhead to obtain a current profits value.
   
   c) `Create new department` allows creation of a new department via an INSERT INTO statement for the database.
   
3. Manager

   a) `Show inventory` is the same SELECT statement customers have.
   
   b) `View low inventory` will show individual products below a specified quantity (default 5), using a SELECT statement.
   
   c) `Restock an item` lets the manager add quantity to a given item (UPDATE products SET x WHERE y).
   
   d) `Add a new product` will create a new product with specified details: name, department (filtered by the existing departments in the departments table), price, and initial stock_quantity.
   
   e) `View transaction log`, finally, will simply display all historical purchases, including the user who made the purchase as well as the date, item, quantity, and total amount charged. This is just a SELECT statement with a JOIN as well.

## Where's the demo you said something about earlier?

Oh - right here:

[![BAMazon App](http://img.youtube.com/vi/R_PeMwk07MY/0.jpg)](https://www.youtube.com/watch?v=R_PeMwk07MY "BAMazon App")
