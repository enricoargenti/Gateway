const { SerialPort } = require('serialport')
const { Message, Client } = require("azure-iot-device");
const { Mqtt } = require("azure-iot-device-mqtt");
const { ReadlineParser } = require('@serialport/parser-readline')
const moment = require('moment');

'use strict';

//---------------------------------------- Variables and constants ------------------------------------------------

// IoTHub client
const connectionString = "HostName=Pi-Cloud.azure-devices.net;DeviceId=Device1;SharedAccessKey=cWAuOHDm1yxil0atVN7QWzm21EblpCnnzw/vmoDUUIw=";
const client = Client.fromConnectionString(connectionString, Mqtt);

// Serial port
const port = new SerialPort({ path: 'COM8', baudRate: 9600 })

// Variables
const gatewayId = '0'; // Per l'invio al PIC
const deviceId = 'Device1'; // Fisso



//---------------------------------------- IoTHub client starts ------------------------------------------------
client.open()
  .then(() => {
    console.log('Connected to IoT Hub. Waiting for messages...');
  })
  .catch((err) => {
    console.error('Error opening the client:', err.message);
  });

//------------------------------------- Receive cloud to device messages -----------------------------------------

client.on("message", handleMessage);

//---------------------------------------- Parsing functions -----------------------------------------------------

function parseMsg(data) {
  console.log('\nData received: ' + data + '\n');
  convertAndSendToCloud(data);
}

// Parses every message using the parseMsg function
const parser = port.pipe(new ReadlineParser({ delimiter: '*' }))
parser.on('data', parseMsg)

//---------------------------------------- Data conversion and sending -------------------------------------------

function convertAndSendToCloud(data) {
  // Encoder for bytes
  let utf8Encode = new TextEncoder();

  // Take the first two bytes
  var byte1 = utf8Encode.encode(data[0]);
  var byte2 = utf8Encode.encode(data[1]);

  // Convert these bytes to numeric values
  var doorId = parseInt(byte1);
  var typeOfMessageInt = parseInt(byte2);

  if(typeOfMessageInt == 1) {
    // Message structure
    var OpenDoorRequest = {
      Id: null,
      DoorId: doorId,
      DeviceId: deviceId,
      DeviceGeneratedCode: data.substring(2, 7),
      CloudGeneratedCode: null,
      CodeInsertedOnDoorByUser: null,
      AccessRequestTime: moment().format('YYYY-MM-DDTHH:mm:ss.SSS'),
      UserId: null,
      TypeOfMessage: "firstMessageFromDoor"
    };
  }
  else if (typeOfMessageInt == 2) {
    // Message structure
    var OpenDoorRequest = {
      Id: null,
      DoorId: doorId,
      DeviceId: deviceId,
      DeviceGeneratedCode: data.substring(2, 7),
      CloudGeneratedCode: null,
      CodeInsertedOnDoorByUser: data.substring(7, 12),
      AccessRequestTime: null,
      UserId: null,
      TypeOfMessage: "secondMessageFromDoor"
    };
  }

  // JSON message
  var jsonOpenDoorRequest = JSON.stringify(OpenDoorRequest);
  console.log(jsonOpenDoorRequest);

  // Send to IoTHub
  var payload = jsonOpenDoorRequest;
  var message = new Message(payload);
  client.sendEvent(message, (err) => {
    if (err) {
      console.error('\nError sending the message to IoTHub: ', err);
    } else {
      console.log('\nMessage sent successfully to IoTHub!\n');
    }
  });

}

//-------------------------------------- Messages from cloud handling -------------------------------------------

function handleMessage(message) {
    console.log('Received message: ' + message.getData().toString());

    // Packet
    try{
      var jsonPacket = message.getData().toString();
      var packet = JSON.parse(jsonPacket);

      // Set variables
      doorId = packet.DoorId.toString();
      action = packet.Action.toString();

      // Send every message to the PICs network
      sendPacketToSerial(doorId, gatewayId, 1, action);
    
    }
    catch(err){
      console.log('Unable to deserialize json');
    }
}

//-------------------------------------- Packet sending through serial -------------------------------------------

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
  

  /*
  port.write("hello", (err) => {
    if (err) {
      console.error('Error writing to serial port:', err);
    } else {
      console.log('Packet sent successfully!');
    }
  });
  */
  
}