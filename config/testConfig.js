
var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyData");
var BigNumber = require('bignumber.js');

var Config = async function(accounts) {
    
    // These test addresses are useful when you need to add
    // multiple users in test scripts
    let testAddresses = [
        "0xd520daf3d2abfd89db85eccbdb139b3a8603b30e",
        "0x1d1b24d7646fe17371f0e3abef529bbec38b0ad3",
        "0x8a4ce9d207a652caeba0efb1d539b2920ea64a05",
        "0x2405f9a3e5293bc93bea4e3eb03668c4fc07aa53",
        "0x698e0ad2ec01fa2d4ebfb4e797d062636dca800b",
        "0x1800fae3011864ecc660bd1db59dcfaf88dc6d96",
        "0x2300337653a6cc45105876ddefe14dae88e75acf",
        "0x66b3249120c3c3a2498c78d72e2667ae5fd9b312",
        "0x41b8121b029d1b5a6abf81001720e3c72cd2d8c0"
    ];
    
    let owner = accounts[0];
    let firstAirline = accounts[1];

    let flightSuretyData = await FlightSuretyData.new(firstAirline);
    let flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address);

    
    return {
        owner: owner,
        firstAirline: firstAirline,
        weiMultiple: (new BigNumber(10)).pow(18),
        weiLow: (new BigNumber(2)).pow(18),
        testAddresses: testAddresses,
        flightSuretyData: flightSuretyData,
        flightSuretyApp: flightSuretyApp
    }
}

module.exports = {
    Config: Config
};