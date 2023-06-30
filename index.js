const { SerialPort } = require('serialport')
const { Client } = require("azure-iot-device");
const { Mqtt } = require("azure-iot-device-mqtt");
const { ReadlineParser } = require('@serialport/parser-readline')

'use strict';

// Variables
var doorId;
var gatewayId;
var action;

const port = new SerialPort({ path: 'COM7', baudRate: 9600 })



// Read 
/*
port.on("open", function() {
    console.log("-- Connection opened --");
    port.on("data", function(data) {
        console.log("Data received: " + data);

        convertAndSendToCloud(data);
        
    });
});
*/


function parseMsg(data) {
  console.log("Data received: " + data);
  convertAndSendToCloud(data);
}

// Parses every message using the parseMsg function
const parser = port.pipe(new ReadlineParser({ delimiter: '*' }))
parser.on('data', parseMsg)


function convertAndSendToCloud(data) {
  // Encoder for bytes
  let utf8Encode = new TextEncoder();

  console.log("Type of data: " + typeof data);
  console.log("data now: " + data);

  // Take the first two bytes
  var byte1 = utf8Encode.encode(data[0]);
  var byte2 = utf8Encode.encode(data[1]);
  console.log("byte1 is type: " + typeof byte1);

  // Convert the bytes to numeric values
  var numericValue1 = parseInt(byte1);
  var numericValue2 = parseInt(byte2);


  console.log('Byte 1: ' + byte1);
  console.log('Byte 2: ' + byte2);
  console.log('Numeric value 1: ' + numericValue1);
  console.log('Numeric value 2: ' + numericValue2);
}

/*
function convertAndSendToCloud(data) {
  // Append the received data to a buffer
  let receivedData = Buffer.alloc(0);
  receivedData = Buffer.concat([receivedData, data]);
  console.log("Received data:" + receivedData);

  // Process the received data byte by byte
  for (let i = 0; i < receivedData.length; i++) {
    const byte = receivedData[i];

    // Convert the byte to a numeric value
    const numericValue = parseInt(byte.toString(16), 16);

    console.log('Numeric value: ' + numericValue);
    console.log();
  }
}
*/


const connectionString = "HostName=Pi-Cloud.azure-devices.net;DeviceId=Device1;SharedAccessKey=cWAuOHDm1yxil0atVN7QWzm21EblpCnnzw/vmoDUUIw=";
const client = Client.fromConnectionString(connectionString, Mqtt);

client.on("message", handleMessage);

function handleMessage(message) {
    console.log("Received message:", message.getData().toString());

    // Packet
    try{
      var jsonPacket = message.getData().toString();
      var packet = JSON.parse(jsonPacket);

      // Set variables
      doorId = packet.DoorId.toString();
      gatewayId = '0';
      action = packet.Action.toString();

      // Send data
      //sendValueToSerial(doorId);
      //sendValueToSerial(gatewayId);
      //sendValueToSerial(action);

    sendPacketToSerial(doorId, gatewayId, 1, action);
    
    }
    catch(err){
      console.log("Unable to deserialize json");
    }
    


}




function sendPacketToSerial(receiver, sender, typeOfMessage, actionToDo) {
  // Create a buffer with the correct size
  const bufferSize = 4;
  const buffer = Buffer.alloc(bufferSize);

  // Write the value to the buffer as a single byte
  buffer.writeUInt8(receiver & 0xFF, 0);
  buffer.writeUInt8(sender & 0xFF, 1);
  buffer.writeUInt8(typeOfMessage & 0xFF, 2);
  buffer.writeUInt8(actionToDo & 0xFF, 3);

  console.log(buffer);

  // Write the buffer to the serial port
  port.write(buffer, (err) => {
    if (err) {
      console.error('Error writing to serial port:', err);
    } else {
      console.log('Packet sent successfully!');
    }
  });
}

// Example usage: sending value 250 and "hello" as a single packet
//sendPacketToSerial(250, 'hello');


client.open()
  .then(() => {
    console.log("Connected to IoT Hub. Waiting for messages...");
  })
  .catch((err) => {
    console.error("Error opening the client:", err.message);
  });

// ----------------------------------------------------------------------------------------------------------------
