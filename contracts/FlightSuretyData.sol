pragma solidity >=0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    uint256 private contractBalance = 0 ether;

    struct Airline {
        bool isRegistered;
        bool isFunded;
    }

    struct PsngrInsrdInfo {
        string flight;
        bool isPaid;
        uint256 insurancePaid;
    }

    struct Passenger {
        bool isInsured;
        mapping(bytes32 => PsngrInsrdInfo) psngrInsrdInfo;
        //PsngrInsrdInfo[] psngrInsrdInfo;
        //bool[] isPaid;
        //uint256[] insurancePaid;
        //string[] flights;
    }

    mapping(address => Airline)   public airlines;
    mapping(address => Passenger) public passengers;
    mapping(string  => address[]) private flightPassengers;  //flight to passengers
    mapping(address => uint256)   private InsurancePayment; //Insurance payouts for passengers
    //mapping(string  => uint256)   private InsuredAmount;
    mapping(address => bool)      private authorizedCallers;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                    address firstAirline
                                )
                                public
    {
        contractOwner = msg.sender;
        registerFirstAirline(firstAirline);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireCallerAuthorized()
    {
        require(authorizedCallers[msg.sender] == true, "Address is not authorized");
        _;
    }

    modifier requireRegisteredAirline(address airline)
    {
        require(airlines[airline].isRegistered == true, "Caller is not a registered airline");
        _;
    }

    modifier requireFundedAirline(address airline)
    {
        require(airlines[airline].isFunded == true, "Caller is not a funded airline");
        _;
    }
    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational()
                            public
                            view
                            returns(bool)
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus
                            (
                                bool mode
                            )
                            external
                            requireContractOwner()
    {
        operational = mode;
    }

    function isAuthorized
                            (
                                address caller
                            )
                            public
                            view
                            returns(bool)
    {
        return authorizedCallers[caller];
    }

    function authorizeCaller
                            (
                                address caller
                            )
                            external
                            requireContractOwner()
    {
      authorizedCallers[caller] = true;
    }

    function isAirlineRegistered
                            (
                               address airline
                            )
                            public
                            view
                            returns (bool)
    {
        return airlines[airline].isRegistered;
    }

    function isRegistered
                      (
                          address airline
                      )
                      public
                      view
                      returns (bool)
    {
        return airlines[airline].isRegistered;
    }

    function isFunded(
                       address airline
                     )
                     public
                     view
                     returns(bool)
    {
        return airlines[airline].isFunded;
    }
    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function registerFirstAirline
                            (
                                address airline
                            )
                            internal
                            requireIsOperational()
    {
        require(msg.sender == contractOwner, "Unauthorized to use this function");
        airlines[airline] = Airline({isRegistered: true, isFunded: false});
        //registered.push(_airline);
    }

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerAirline
                            (
                              address airline,
                              address caller
                            )
                            external
                            requireIsOperational()
                            requireCallerAuthorized()
                            requireRegisteredAirline(caller)
                            requireFundedAirline(caller)
                            returns
                            (
                              bool success
                            )
    {
        require(!airlines[airline].isRegistered, "Airline is already registered");
        airlines[airline] = Airline({isRegistered: true, isFunded: false});
        success = true;
    }


   /**
    * @dev Buy insurance for a flight
    *
    */
    function buy
                            (
                                address  airline,
                                string   flight,
                                uint256  timestamp,
                                address  passenger,
                                uint     amount
                            )
                            external
                            requireIsOperational()
                            requireCallerAuthorized()
    {
        bytes32 flightkey = getFlightKey(airline, flight, timestamp);

        //If the passenger is already insured before
       if(passengers[passenger].isInsured == true){
         string memory _flight = passengers[passenger].psngrInsrdInfo[flightkey].flight;
         require(keccak256(abi.encodePacked(_flight)) != keccak256(abi.encodePacked(flight)), "Passenger already insured for this flight");

        //Add new flight insurance info
        passengers[passenger].psngrInsrdInfo[flightkey].flight = flight;
        passengers[passenger].psngrInsrdInfo[flightkey].isPaid = false;
        passengers[passenger].psngrInsrdInfo[flightkey].insurancePaid = amount;
       }else{
        passengers[passenger] = Passenger({isInsured: true});
        passengers[passenger].psngrInsrdInfo[flightkey].flight = flight;
        passengers[passenger].psngrInsrdInfo[flightkey].isPaid = false;
        passengers[passenger].psngrInsrdInfo[flightkey].insurancePaid = amount;
       }

        contractBalance = contractBalance.add(amount);
        flightPassengers[flight].push(passenger);

        //require(passengers[passenger].psngrInsrdInfo[flightkey].isPaid == false, "test1");
        //require(passengers[passenger].psngrInsrdInfo[flightkey].insurancePaid == 1000000000000000000, "test2");
        //require(flightPassengers[flight][0] == passenger, "test3");
        //require(1 == 2, "test4");
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                   address  airline,
                                   string   flight,
                                   uint256  timestamp
                                )
                                external
                                requireIsOperational()
                                requireCallerAuthorized()
    {
        bytes32 flightkey = getFlightKey(airline,flight,timestamp);
        uint amount = 0;
        for(uint i = 0; i < flightPassengers[flight].length; i++){
          address aa = flightPassengers[flight][0];
          require(passengers[aa].psngrInsrdInfo[flightkey].insurancePaid == 1000000000000000000, "test2");
          if(passengers[flightPassengers[flight][i]].psngrInsrdInfo[flightkey].isPaid == false){
            passengers[flightPassengers[flight][i]].psngrInsrdInfo[flightkey].isPaid = true;
            amount = (passengers[flightPassengers[flight][i]].psngrInsrdInfo[flightkey].insurancePaid).mul(15).div(10);
            InsurancePayment[flightPassengers[flight][i]] = InsurancePayment[flightPassengers[flight][i]].add(amount);
          }
        }
    }

    function getPassengerCredits
                          (
                            address passenger
                          )
                          external
                          view
                          requireIsOperational()
                          requireCallerAuthorized()
                          returns(uint)
    {
        return InsurancePayment[passenger];
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                                address payee
                            )
                            external
                            payable
                            requireIsOperational()
    {
        require(InsurancePayment[payee] > 0, "There is no payment");
        uint amount = InsurancePayment[payee];
        InsurancePayment[payee] = 0;
        contractBalance = contractBalance.sub(amount);
        payee.transfer(amount);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */
    function fund
                            (
                                address airline,
                                uint256 fundAmount
                            )
                            public
                            requireIsOperational()
                            requireCallerAuthorized()
    {
        airlines[airline].isFunded = true;
        contractBalance = contractBalance.add(fundAmount);
        //registered.push(sender);
        //emit Receive(fundAmt);
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        internal
                        pure
                        returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function()
                            external
                            payable
    {
      //  fund();
    }


}
