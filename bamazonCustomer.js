var mysql = require("mysql");
var inquirer = require("inquirer");
require("console.table");

var connection = mysql.createConnection({
	host: "localhost",
	port: 8889,
	user: "root",
	password: "root",
	database: "bamazon_db"
});

connection.connect(function(err) {
	if (err) return console.log("Error connecting: " + err.stack);
	loadProducts();
});

function loadProducts() {
	connection.query("SELECT * FROM products", function(err, res) {
		if (err) return err;
		console.table(res);
		promptItem(res);
	});
};

function checkInventory(choiceId, inventory) {
	for (var i = 0; i < inventory.length; i++) {
		if (inventory[i].item_id === choiceId) return inventory[i];
	}
	return null;
};

function promptItem(inventory) {
	inquirer.prompt([
		{
			type: "input",
			name: "choice",
			message: "What is the ID of the item you would you like to purchase?",
			validate: function(val) { return !isNaN(val) }
		}
	]).then(function(val) {
		var choiceId = parseInt(val.choice);
		var product = checkInventory(choiceId, inventory);

		if (product) {
			promptItemQuanity(product);
		} else {
			console.log("\nThat item is not in stock.");
			loadProducts();
		};
	});
};

function promptItemQuanity(product) {
	inquirer.prompt([
		{
			type: "input",
			name: "quantity",
			message: "How many would you like?",
			validate: function(val) { return val > 0 }
		}
	]).then(function(val) {
		var quantity = parseInt(val.quantity);

		if (quantity > product.stock_quantity) {
			console.log("\nSorry we don't hold that many of that item! Bringing you back to the main selection...");
			loadProducts();
		} else { purchase(product, quantity) };
	});
};

function purchase(product, quantity) {
	connection.query(
		"UPDATE products SET stock_quantity = stock_quantity - ?, product_sales = product_sales + ? WHERE item_id = ?",
		[quantity, product.price * quantity, product.item_id],
		function(err, res) {
			console.log("\nSuccessfully purchased " + quantity + " " + product.product_name + "'s! Enjoy!");
			loadProducts();
		}
	);
};