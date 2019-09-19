import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);

const ORACLES_COUNT = 10; //30
let oracles = {};

web3.eth.getAccounts().then((accounts) => {

  flightSuretyData.methods.authorizeCaller(config.appAddress).send({ from: accounts[0] })
    .then(result => {
      console.log("appAddress registered as the authorized contract");
    })
    .catch(error => {
      console.log("Error in authorizing appContract. " + error);
    });


  flightSuretyApp.methods.REGISTRATION_FEE().call({ from: accounts[0] }).then(fee => {
    for (let a = 1; a < ORACLES_COUNT; a++) {
      flightSuretyApp.methods.registerOracle().send({ from: accounts[a], value: fee, gas: 3000000 })
        .then(result => {
          flightSuretyApp.methods.getMyIndexes().call({ from: accounts[a] })
            .then(indices => {
              oracles[accounts[a]] = indices;
              console.log("Oracle registered: " + accounts[a] + " indices:" + indices);
            })
        })
        .catch(error => {
          console.log("Error while registering oracles: " + accounts[a] + " Error: " + error);
        });
    }
  })
  
});


flightSuretyApp.events.OracleRequest({ fromBlock: 0 }, async function (error, event) {
  if (error) {
    console.log(error);
  } else {
    //console.log(event);

    let indexes;

    let index = event.returnValues.index;
    let airline = event.returnValues.airline;
    let flight = event.returnValues.flight;
    let timestamp = event.returnValues.timestamp;

    var statusCodes = [0, 10, 20, 30, 40, 50];
    var statusCode = 20;//statusCodes[Math.floor(Math.random() * statusCodes.length)];

    for (var key in oracles) {
      indexes = oracles[key];
      
      //console.log("key:"+key);
      //console.log("idx:"+indexes);

      if (indexes.includes(index)) {
        // Submit Oracle Response
        //oracle = registeredOracles[i][0];
        await submitResponse(index, airline, flight, timestamp, statusCode, key);

      }
    }

  }

});


async function submitResponse(index, airline, flight, timestamp, statusCode, oracle) {
  //console.log("submitResponse");
  try {
    await flightSuretyApp.methods.submitOracleResponse(index, airline, flight, timestamp, statusCode)
      .send({ from: oracle, gas: 200000 }, (error, result) => {
        if (error) {
          console.log(error);
        } else {
          //console.log(result);
          console.log("Sent Oracle Response for " + oracle + " Status Code: " + statusCode);

        }
      });
  } catch (e) {
    //console.log(e);
  }
}

const app = express();
app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!'
  })
})

export default app;


