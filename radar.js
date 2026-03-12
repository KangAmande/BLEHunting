const noble = require('@abandonware/noble');
console.log('Starting radar...');
noble.on('stateChange', async(state) => {
    if (state === 'poweredOn') {
        console.log('Scanning for devices...');
        await noble.startScanningAsync([], true);
    } else {
        console.log(`Bluetooth state: ${state}. Please turn it on to start scanning.`);
    }
});
noble.on('discover', (peripheral) => {
    const name = peripheral.advertisement.localName || 'Unknown Peripheral';
    const ID = peripheral.id || 'Unknown ID';
    const rssi = peripheral.rssi;
    const address = peripheral.address !== 'unknown' ? peripheral.address : peripheral.id;
    const privacyLeak = peripheral.advertisement.localName ? 'Data Leak : Name Public' : 'Private';
    const mfgData = peripheral.advertisement.manufacturerData;
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
});