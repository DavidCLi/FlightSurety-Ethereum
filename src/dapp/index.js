
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async () => {

    let result = null;

    let contract = new Contract('localhost', () => {

        contract.flightSuretyApp.events.FlightStatusInfo({
            fromBlock: 0
        }, async function (error, result) {
            if (error) console.log(error)
            else {
                let flightStatus = 0;
                flightStatus = result2.status;
                console.log("Flight Status Info:" + result);
                displayFlightStatus('display-flightStatusInfo', 'Flight Status', '', flightStatus, [{ label: 'Flight Status : ', error: error, value: result.flight + ' ' + result.timestamp }]);
            }
        });

        // Read transaction
        contract.isOperational((error, result) => {
            //console.log(error, result);
            display('Operational Status', 'Check if contract is operational', [{ label: 'Operational Status', error: error, value: result }]);
        });

        populateAirlineSelect("airlines", contract.airlines);
        populateFlightSelect("flights", contract.flights);
        populateFlightSelect("flights-insu", contract.flights);
        populateFlightSelect("flights-status", contract.flights);

        DOM.elid('fund').addEventListener('click', () => {
            let airline = DOM.elid('airlines').value;
            let amount = DOM.elid('fundAmount').value;
            // Write transaction
            if (amount == 10) {
                contract.fundAirline(airline, amount, (tx, result) => {
                    displayFund('Airline funding', [{ label: 'Funding status : ', TXid: tx, airline: result, amount: amount }]);
                });

            }
            else {
                alert("Airlines need to pay 10 ETH (Only support 10 ETH Now)");
            }
        })
        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flights').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                displayFlightStatus('display-flight-status', 'Oracles', 'Trigger oracles', 0, [{ label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp }]);
            });
        })

        DOM.elid('purchase').addEventListener('click', () => {
            let flight = DOM.elid('flights-insu').value;
            let amount = DOM.elid('insurance').value;
            if (amount != "" && amount != 0) {
                contract.insurePassenger(contract.passengers[1], flight, amount, (error, result) => {
                    let text = result;
                    if(error) text = error;
                    displayPurchase('Insurance Purchase', [{ label: 'Purchase TX# : ', text: text, flight: flight, amount: amount }]);
                });
            }
            else {
                alert("Insurance Amount should be greater than 0");
            }
        })

        DOM.elid('flight-status').addEventListener('click', () => {
            let flight = DOM.elid('flights-status').value;
            let flightStatus = 0;
            //displayFlightStatus('display-flightStatusInfo', 'Flight Status', '', flightStatus, [{ label: 'Flight Status : ', error: 'test', value: 'test' + ' ' + 'test' }]);
            
            contract.fetchFlightStatus(flight, (error, result) => {
               /*
               contract.flightStatusInfo(result2 => {
                    flightStatus = result2.status;
                    displayFlightStatus('display-flightStatusInfo', 'Flight Status', '', flightStatus, [{ label: 'Flight Status : ', error: error, value: result.flight + ' ' + result.timestamp }]);
                });
                */
            });
        })

        DOM.elid('checkCredit').addEventListener('click', () => {
            getCredits();
        })

        DOM.elid('getBalance').addEventListener('click', () => {
            getPassBalance();
        })

        async function getCredits() {
            await contract.getPassengerCredits(contract.passengers[1], (result) => {
                DOM.elid('creditAmount').textContent = result;
            });
        }

        async function getPassBalance() {
            await contract.getPassengerBalance(contract.passengers[1], (result) => {
                DOM.elid('BalanceAmount').textContent = result;
            });
        }

        DOM.elid('withdraw').addEventListener('click', () => {
            contract.withdraw(contract.passengers[1], (result) => {
                DOM.elid('withdraw-status').innerHTML = DOM.elid('withdraw-status').innerHTML + "<br> TX ID: " + result;
            });
        })
    });


})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({ className: 'row' }));
        row.appendChild(DOM.div({ className: 'col-sm-4 field' }, result.label));
        row.appendChild(DOM.div({ className: 'col-sm-8 field-value' }, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);
}

function populateAirlineSelect(id, selectOpts) {
    let select = DOM.elid(id);
    //let index = type == 'airline' ? 0 : 1;
    selectOpts.forEach(opt => {
        var option = document.createElement("option");
        option.value = opt[0];
        option.text = opt[1];
        select.add(option);
    });
}

function populateFlightSelect(id, selectOpts) {
    let select = DOM.elid(id);
    //let index = type == 'airline' ? 0 : 1;
    selectOpts.forEach(opt => {
        var option = document.createElement("option");
        option.value = opt[1];
        option.text = opt[1];
        select.add(option);
    });
}

function displayFund(title, results) {
    let displayDiv = DOM.elid("display-funding-status");
    let section = DOM.section();
    section.appendChild(DOM.h5(title));
    results.map((result) => {
        let row = section.appendChild(DOM.div({ className: 'row' }));
        row.appendChild(DOM.div({ className: 'col-sm-4 field' }, String(result.airline) + " Funded."));
        row.appendChild(DOM.div({ className: 'col-sm-8 field-value' }, result.TXid ? ("TX Id : " + String(result.TXid)) : ("Funded : TX: " + String(result.airline))));
        section.appendChild(row);
    })
    displayDiv.append(section);
}

function displayFlightStatus(id, title, description, status, results) {
    let displayDiv = DOM.elid(id);
    let section = DOM.section();
    displayDiv.innerHTML = "";
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    //section.appendChild(DOM.h6("test"));
    let statusDes;
    switch (status) {
        case "0":
            statusDes = "Unknown";
            break;
        case "10":
            statusDes = "On Time";
            break;
        case "20":
            statusDes = "Late due to Airline";
            break;
        case "30":
            statusDes = "Late due to Weather";
            break;
        case "40":
            statusDes = "Late due to Technical Issues";
            break;
        case "50":
            statusDes = "Late due to Other Reasons";
            break;
    }
    results.map((result) => {
        let row = section.appendChild(DOM.div({ className: 'row' }));
        row.appendChild(DOM.div({ className: 'col-sm-4 field' }, result.label));
        row.appendChild(DOM.div({ className: 'col-sm-8 field-value' }, result.error ? String(result.error) : String(result.value)));
        row.appendChild(DOM.div({ className: 'col-sm-4 field' }, "Status"));
        row.appendChild(DOM.div({ className: 'col-sm-8 field-value' }, String(statusDes)));
        section.appendChild(row);
    })
    displayDiv.append(section);
}

function displayPurchase(title, results) {
    let displayDiv = DOM.elid("display-insurance-status");
    let section = DOM.section();
    displayDiv.innerHTML = "";
    section.appendChild(DOM.h5(title));
    results.map((result) => {
        let row = section.appendChild(DOM.div({ className: 'row' }));
        row.appendChild(DOM.div({ className: 'col-sm-4 field' }, result.label));
        row.appendChild(DOM.div({ className: 'col-sm-8 field-value' }, result.error ? String(result.error) : String(result.text)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}
