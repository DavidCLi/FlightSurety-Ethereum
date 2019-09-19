import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));

        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);

        this.initialize(callback, config);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
        this.flights = [];

    }

    initialize(callback, config) {
        this.web3.eth.getAccounts(async (error, accts) => {

            this.owner = accts[0];

            let counter = 0;//1;
            let airlineNames = ['AL1', 'AL2', 'AL3', 'AL4', 'AL5'];
            let flightNumbers = ['F1', 'F2', 'F3', 'F4', 'F5'];
            let flight = [];
            let airline = [];
            let timestamp = 0;

            while (this.airlines.length < 5) {
                //Create Flight array
                timestamp = Math.floor((Date.now() + (43200 + counter)) / 1000);
                flight.push(accts[counter]); //Airline
                flight.push(flightNumbers[counter]); //flight number
                flight.push(timestamp); //timestamp
                flight.push(airlineNames[counter]); //airline name                 

                //Create airlines array
                airline.push(accts[counter]); //account number
                airline.push(airlineNames[counter]); //airline name
                airline.push(false); //funding status

                this.airlines.push(airline);
                this.flights.push(flight);

                //reset arrays
                flight = [];
                airline = [];
                counter++;
            }

            while (this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            //Set authorize caller for the data app
            this.authorizeCaller(config.appAddress);

            //register the airlines and flights
            this.fundAirline(this.airlines[0][0], "10");
            this.registerAirlines((error, result) => { }); //Registers airlines
            this.registerFlights((error, result) => { }); //Register flights 

            callback();
        });
    }

    async isOperational(callback) {
        let self = this;
        await self.flightSuretyApp.methods.isOperational().call({ from: self.owner }, (error, result) => {
            if (error) {
                console.log(error);
            } else {
                callback(result);
            }
        });
    }

    async authorizeCaller(address, callback) {
        let self = this;
        await self.flightSuretyData.methods.authorizeCaller(address).call({ from: self.owner }, (error, result) => {
            if (error) {
                console.log(error);
            } else {
                callback;
            }
        });
    }

    async registerAirlines(callback) {
        let self = this;
        for (var i = 1; i < self.airlines.length; i++) {
            await self.flightSuretyApp.methods.registerAirline(self.airlines[i][0]).send({ from: self.owner, gas: 3000000 }, (error, result) => {
                //console.log("Airline:" + self.airlines[i][1]);
                callback(error, result);
            });
        }
    }

    async registerFlights(callback) {
        let self = this;
        for (var i = 0; i < self.flights.length; i++) {
            await self.flightSuretyApp.methods.registerFlight(self.flights[i][0], self.flights[i][1], self.flights[i][2]).send({ from: self.owner, gas: 3000000 }, (error, result) => {
                callback(error, result);
            });
           // console.log("Flight:" + self.flights[i][0] + "/" + self.flights[i][1] + "/" + self.flights[i][2] + " is registered");
        }
    }

    async fundAirline(airline, amount, callback) {
        let self = this;
        let sendAmount = self.web3.utils.toWei(amount, "ether").toString();
        await self.flightSuretyApp.methods.fund().send({ from: airline, value: sendAmount, gas: 3000000 }, (error, result) => {
            if (error) {
                console.log(error);
            } else {
                let airlineName;
                for (var i = 0; i < this.airlines.length; i++) {
                    if (self.airlines[i][0] == airline) {
                        self.airlines[i][2] = true;
                        airlineName = self.airlines[i][1];
                        break;
                    }
                }
                callback(result, airlineName);
            }
        });
    }

    async insurePassenger(passenger, flight, amount, callback) {
        let self = this;
        let sendAmount = self.web3.utils.toWei(amount, "ether").toString();
        let flightInfo;
        for (var i = 0; i < self.flights.length; i++) {
            if (self.flights[i][1] == flight) {
                flightInfo = self.flights[i];
                //console.log(flightInfo)
                break;
            }
        }
        console.log(sendAmount);
        await self.flightSuretyApp.methods.insurePassenger(flightInfo[1], flightInfo[2], flightInfo[0], passenger)
            .send({ from: passenger, value: sendAmount, gas: 3000000 }, (error, result) => {
                callback(error, result);
            });
    }

    async withdraw(passenger, callback) {
        let self = this;
        await self.flightSuretyApp.methods.payoutFunds().send({ from: passenger }, (error, result) => {
            if (error) {
                console.log(error);
            } else {
                callback(result);
            }
        });
    }

    async fetchFlightStatus(flight, callback) {
        let self = this;
        let flightInfo;
        for (var i = 0; i < self.flights.length; i++) {
            if (self.flights[i][1] == flight) {
                flightInfo = self.flights[i];
                break;
            }
        }
        let payload = {
            airline: flightInfo[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        }
        await self.flightSuretyApp.methods.fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner }, (error, result) => {
                callback(error, payload);
            });
    }

    async flightStatusInfo(callback) {
        let self = this;
        self.flightSuretyApp.events.FlightStatusInfo({}, function (error, event) {
            if (error) {
                console.log(error);
            }
            else {
                callback(event.returnValues);
            }
        })
    }

    async getPassengerCredits(passenger, callback) {
        let self = this;
        self.flightSuretyApp.methods.getPassengerCredits(passenger).call({ from: passenger }, (error, result) => {
            if (error) {
                console.log(error);
            } else {
                callback(result);
            }
        });
    }

    async getPassengerBalance(passenger, callback) {
        let self = this;
        let balance = await self.web3.eth.getBalance(passenger);
        callback(balance);
    }
}