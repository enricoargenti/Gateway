const { SerialPort } = require('serialport')
const { Client } = require("azure-iot-device");
const { Mqtt } = require("azure-iot-device-mqtt");

'use strict';

// Variables
var doorId;
var gatewayId;
var action;

//var message = "Hakuna Matata";
const port = new SerialPort({ path: 'COM7', baudRate: 14400 })

// Write
/*
port.write(message, function(err) {
  if (err) {
    return console.log("Error on write: ", err.message);
  }
  console.log("Message sent successfully");
});
*/

/*
// Read 
port.on("open", function() {
    console.log("-- Connection opened --");
    port.on("data", function(data) {
        console.log("Data received: " + data);
    });
});
*/

const connectionString = "HostName=Pi-Cloud.azure-devices.net;DeviceId=Device1;SharedAccessKey=cWAuOHDm1yxil0atVN7QWzm21EblpCnnzw/vmoDUUIw=";
const client = Client.fromConnectionString(connectionString, Mqtt);

client.on("message", handleMessage);

function handleMessage(message) {
    console.log("Received message:", message.getData().toString());

    // Packet
    var jsonPacket = message.getData().toString();
    var packet = JSON.parse(jsonPacket);

    // Set variables
    doorId = packet.DoorId.toString();
    gatewayId = '0';
    action = packet.Action.toString();

    // Send data
    sendValueToSerial(doorId);
    sendValueToSerial(gatewayId);
    sendValueToSerial(action);
    


}

function sendValueToSerial(value) {
  // Convert the value to a single byte
  const byte = value & 0xFF;

  // Write the byte to the serial port
  port.write(Buffer.from([byte]), (err) => {
    if (err) {
      console.error('Error writing to serial port:', err);
    } else {
      console.log('Value sent successfully!');
    }
  });
}


client.open()
  .then(() => {
    console.log("Connected to IoT Hub. Waiting for messages...");
  })
  .catch((err) => {
    console.error("Error opening the client:", err.message);
  });

// ----------------------------------------------------------------------------------------------------------------
