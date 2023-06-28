const { SerialPort } = require('serialport')
var message = "Hakuna Matata";


const port = new SerialPort({ path: 'COM8', baudRate: 14400 })


// Write
port.write(message, function(err) {
  if (err) {
    return console.log("Error on write: ", err.message);
  }
  console.log("Message sent successfully");
});

// Read 
port.on("open", function() {
    console.log("-- Connection opened --");
    port.on("data", function(data) {
        console.log("Data received: " + data);
    });
});