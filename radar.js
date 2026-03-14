const noble = require('@abandonware/noble');

// Variables needed for the web server and real-time communication
const express = require('express');
const http = require('http');
const {Server} = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static('public'));
const scanTime = 60 * 1000; // 60 seconds

const appearanceMap = {
  0: "Unknown Ghost",
  64: "Phone",
  128: "Computer",
  193: "Sports Watch",
  384: "Remote Control",
  576: "Asset Tracker/Tag",
  832: "Thermometer",
  896: "Heart Rate Monitor",
  961: "Keyboard",
  962: "Mouse",
  963: "Gamepad"
};

const BLE_SERVICES = {
  // --- Core Infrastructure ---
  "1800": "Generic Access (Device Name/Appearance)",
  "1801": "Generic Attribute (Service Changed)",
  "180a": "Device Information (Manufacturer/Model)",
  
  // --- HID & Input ---
  "1812": "Human Interface Device (Mouse/Keyboard/Gamepad)",
  "1813": "Scan Parameters",
  
  // --- Health & Fitness ---
  "180d": "Heart Rate Monitor",
  "180e": "Phone Alert Status",
  "180f": "Battery Service",
  "1810": "Blood Pressure",
  "1814": "Running Speed and Cadence",
  "181b": "Body Composition",
  "181d": "Weight Scale",
  "181e": "Bond Management",
  "181f": "Continuous Glucose Monitoring",
  
  // --- Smart Home & Sensors ---
  "181a": "Environmental Sensing (Temp/Humidity/Lux)",
  "1815": "Automation IO",
  "1821": "Indoor Positioning",
  
  // --- Security & Proximity ---
  "1802": "Immediate Alert (Find My Device/Buzzer)",
  "1803": "Link Loss (Anti-Theft/Proximity)",
  "1804": "Tx Power Level",
  
  // --- Proprietary / Ecosystem Beacons (16-bit) ---
  "a201": "Proprietary Control Service (Custom)",
  "feaa": "Google Eddystone (Beacon)",
  "fed8": "Google Weave / Project Astra",
  "feaf": "Apple Continuity (AirDrop/Handoff)",
  "fd87": "Apple Find My (AirTag/iCloud Tracking)",
  "fee0": "Xiaomi Mi Band / Health",
  "fe9f": "Google Fast Pair Service",
  "fe59": "Nordic DFU (Wireless Firmware Update)",
  "fffe": "Alliance for Wireless Power (A4WP)",
  "fd82": "Honor/Huawei Ecosystem (Magic-Link/Nearby)",
  "fd87": "Apple Find My (AirTag/iCloud)",
  "feaa": "Google Eddystone (Beacon)",
  "fe9f": "Google Fast Pair"
};

console.log('Starting radar...');
noble.on('stateChange', async(state) => {
    if (state === 'poweredOn') {
        try{
            console.log('Scanning for devices...');
            await noble.startScanningAsync([], true);
            setTimeout(async () => {
                await noble.stopScanningAsync();
                console.log('Stopped scan after a minute.');
                process.exit(0);
            }, scanTime);
        }catch (err){
            console.error("Error starting scan: ", err);
        }
    } else {
        console.log(`Bluetooth state: ${state}. Please turn it on to start scanning.`);
    }
});

noble.on('discover', (peripheral) => {
    const name = peripheral.advertisement.localName || 'Unknown Peripheral';
    const ID = peripheral.id || 'Unknown ID';
    const rssi = peripheral.rssi;
    const appearance = peripheral.advertisement.appearance;
    const appearanceDesc = appearanceMap[appearance] || `Unknown type`;
    const address = peripheral.address !== 'unknown' ? peripheral.address : peripheral.id;
    const privacyLeak = peripheral.advertisement.localName ? 'Data Leak : Name Public' : 'Private';
    const mfgData = peripheral.advertisement.manufacturerData;
    const serviceUuids = peripheral.advertisement.serviceUuids || [];
  
    // Map the UUIDs to their names
    const knownServices = serviceUuids
        .map(uuid => BLE_SERVICES[uuid.toLowerCase()] || `Unknown Service (${uuid})`)
        .join(', ');

    let mfgName = "Unknown Manufacturer";
    
    // Check if mfgData exists AND has at least 2 bytes before reading
    if (Buffer.isBuffer(mfgData) && mfgData.length >= 2) {
      const code = mfgData.readUInt16LE(0); 
      
      if (code === 0x004C) mfgName = "Apple Inc.";
      else if (code === 0x0059) mfgName = "Nordic Semiconductor";
      else if (code === 0x0006) mfgName = "Microsoft";
      else mfgName = `ID: 0x${code.toString(16).toUpperCase()}`;
    }
    console.log('------------------------------------------------------------');
    console.log(`Device Name: ${name}`);
    console.log(`ID: ${ID}`);
    console.log(`Address: ${address}`);
    console.log(`RSSI: ${rssi} dBm`);
    console.log(`Manufacturer Name: ${mfgName}`);
    console.log(`Privacy Leak: ${privacyLeak}`);
    if (serviceUuids.length > 0) {
        console.log(`Capabilities: ${knownServices}`);
    }

    const devicesData = {
        id: ID,
        name: name,
        address: address,
        rssi: rssi,
        appearance: appearanceDesc,
        type: knownServices || 'Unknown',
        lastSeen: new Date().toLocaleTimeString(),
        mfg: mfgName,
        privacy: privacyLeak
    };
    
    // Send the device data to the web UI in real-time
    io.emit('device-spotted', devicesData);
});

server.listen(3000, () => {
    console.log('[\u{1F310}] Dashboard ready at http://localhost:3000');
});