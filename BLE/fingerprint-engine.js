class FingerprintEngine {
    constructor() {
        this.signatures = [
            {
                name: "Apple AirTag",
                type: "Tracker",
                match: (data) => data.mfg?.startsWith('4c001219'), 
                risk: "Medium" // Potential stalking device
            },
            {
                name: "Microsoft Swift Pair",
                type: "PC/Laptop",
                match: (data) => data.mfg?.startsWith('06000300'),
                risk: "Low"
            },
            {
                name: "Google Fast Pair",
                type: "Audio/Ecosystem",
                match: (data) => data.services?.includes('fe9f'),
                risk: "Low"
            },
            {
                name: "Tile Tracker",
                type: "Tracker",
                match: (data) => data.services?.includes('feed'),
                risk: "Medium"
            },
            {
                name: "Beken LED Controller",
                type: "IoT/Light",
                match: (data) => data.mfg?.startsWith('0059') && data.mfg?.length === 42,
                risk: "Low"
            }
        ];
    }

    identify(peripheral) {
        const data = {
            mfg: peripheral.advertisement.manufacturerData?.toString('hex'),
            services: peripheral.advertisement.serviceUuids || []
        };

        for (const sig of this.signatures) {
            if (sig.match(data)) {
                return { 
                    identity: sig.name, 
                    category: sig.type, 
                    risk: sig.risk 
                };
            }
        }

        return { identity: "Unknown Entity", category: "Generic", risk: "Low" };
    }
}

module.exports = new FingerprintEngine();