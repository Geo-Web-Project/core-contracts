/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  PCOLicenseClaimerFacet,
  PCOLicenseClaimerFacetInterface,
} from "../PCOLicenseClaimerFacet";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "_licenseId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "_payer",
        type: "address",
      },
    ],
    name: "ParcelClaimed",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "int96",
        name: "initialContributionRate",
        type: "int96",
      },
      {
        internalType: "uint256",
        name: "initialForSalePrice",
        type: "uint256",
      },
      {
        internalType: "uint64",
        name: "baseCoordinate",
        type: "uint64",
      },
      {
        internalType: "uint256[]",
        name: "path",
        type: "uint256[]",
      },
    ],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getAuctionEnd",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAuctionStart",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getBeacon",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "licenseId",
        type: "uint256",
      },
    ],
    name: "getBeaconProxy",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getEndingBid",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "getNextProxyAddress",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getStartingBid",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "auctionStart",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "auctionEnd",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "startingBid",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "endingBid",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "beacon",
        type: "address",
      },
    ],
    name: "initializeClaimer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "requiredBid",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "auctionEnd",
        type: "uint256",
      },
    ],
    name: "setAuctionEnd",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "auctionStart",
        type: "uint256",
      },
    ],
    name: "setAuctionStart",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "beacon",
        type: "address",
      },
    ],
    name: "setBeacon",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "endingBid",
        type: "uint256",
      },
    ],
    name: "setEndingBid",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "startingBid",
        type: "uint256",
      },
    ],
    name: "setStartingBid",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506124b1806100206000396000f3fe60806040523480156200001157600080fd5b5060043610620001085760003560e01c8063644e979711620000a357806398dec6cc116200006e57806398dec6cc14620002515780639fcbf16b146200029c578063c250dc8b14620002b3578063d42afb5614620002bd57600080fd5b8063644e979714620001e4578063738ce0ca14620001fb57806385c04d7a146200021257806387dc0c55146200023a57600080fd5b80631cbb2ce311620000e45780631cbb2ce314620001545780632d6b3a6b146200016b57806331b2ab2614620001b45780635ced333414620001cb57600080fd5b8062e8842c146200010d5780630556e9b91462000126578063181f4456146200013d575b600080fd5b620001246200011e36600462001a3f565b620002d4565b005b620001246200013736600462001a8f565b6200038a565b620001246200014e36600462001a8f565b620003b8565b620001246200016536600462001a8f565b620003d5565b7f3b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc5546001600160a01b03165b6040516001600160a01b0390911681526020015b60405180910390f35b62000124620001c536600462001abf565b62000403565b620001d562000810565b604051908152602001620001ab565b6000805160206200245c83398151915254620001d5565b620001246200020c36600462001a8f565b62000821565b7f3b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc454620001d5565b6000805160206200243c83398151915254620001d5565b620001976200026236600462001a8f565b60009081527f3b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc660205260409020546001600160a01b031690565b62000197620002ad36600462001bc6565b6200083e565b620001d5620009a6565b62000124620002ce36600462001bc6565b620009c4565b620002de62000a0f565b6000805160206200245c833981519152949094556000805160206200243c833981519152929092557f3b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc3557f3b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc4557f3b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc580546001600160a01b0319166001600160a01b03909216919091179055565b6200039462000a0f565b7f3b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc355565b620003c262000a0f565b6000805160206200245c83398151915255565b620003df62000a0f565b7f3b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc455565b6000805160206200245c8339815191527f6ee8bf8f33d87ee8fc792bdab0fa8c5d1fb2132b416aab215664bf4732bc299760006200044062000a9a565b905080861015620004cf5760405162461bcd60e51b815260206004820152604860248201527f50434f4c6963656e7365436c61696d657246616365743a20496e697469616c2060448201527f666f722073616c6520707269636520646f6573206e6f74206d656574207265716064820152671d5a5c995b595b9d60c21b608482015260a4015b60405180910390fd5b6000620004db62000b3b565b336000818152600687016020908152604080832054905194955091936200051c9392910160609290921b6001600160601b0319168252601482015260340190565b60408051601f198184030181529082905280516020909101206004870154909130916001600160a01b0316906200055390620019b1565b6001600160a01b039283168152911660208201526040018190604051809103906000f59050801580156200058b573d6000803e3d6000fd5b5033600090815260068701602052604081208054929350600192909190620005b590849062001bfc565b9091555050600082815260058601602052604080822080546001600160a01b0319166001600160a01b03851617905551339184917f97c7a37a01ea09716c8cd03bacec8d6db1e30927bfa2ff373e434b074f81775f9190a36200061a33888862000b65565b6002840154604051635b69006f60e11b81527fa9214cc96615e0085d3bb077758db69497dc2dce3b2b1e97bc93c3d18d83efd360048201526000916001600160a01b03169063b6d200de90602401602060405180830381865afa15801562000686573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190620006ac919062001c17565b60018601546040516346ccbfb760e11b81526001600160a01b039182166004820152600b8d900b602482015291925060009190831690638d997f6e90604401602060405180830381865afa15801562000709573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906200072f919062001c37565b60018701549091506200074e906001600160a01b031633858462000b91565b5050846001015442116200077e57835460018501546200077e916001600160a01b03918216913391168b62000b91565b604051631355165f60e01b8152306004820181905260248201819052604482015260648101839052336084820152600b8a900b60a482015260c481018990526001600160a01b03821690631355165f9060e401600060405180830381600087803b158015620007ec57600080fd5b505af115801562000801573d6000803e3d6000fd5b50505050505050505050505050565b60006200081c62000a9a565b905090565b6200082b62000a0f565b6000805160206200243c83398151915255565b6001600160a01b03811660009081527f3b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc7602090815260408083205490516001600160601b0319606086901b169281019290925260348201526000805160206200245c833981519152906001600160f81b03199030906054016040516020818303038152906040528051906020012060405180602001620008de90620019b1565b601f1982820381018352601f90910116604081815260048701543060208401526001600160a01b03169082015260600160408051601f19818403018152908290526200092e929160200162001c80565b604051602081830303815290604052805190602001206040516020016200098794939291906001600160f81b031994909416845260609290921b6001600160601b03191660018401526015830152603582015260550190565b60408051601f1981840301815291905280516020909101209392505050565b6000806000805160206200245c8339815191525b6002015492915050565b620009ce62000a0f565b7f3b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc580546001600160a01b0319166001600160a01b0392909216919091179055565b7fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c600401546001600160a01b0316331462000a985760405162461bcd60e51b815260206004820152602260248201527f4c69624469616d6f6e643a204d75737420626520636f6e7472616374206f776e60448201526132b960f11b6064820152608401620004c6565b565b6000805160206200243c833981519152546000906000805160206200245c8339815191529042111562000ad05760030154919050565b805460009062000ae1904262001cb3565b905060008260000154836001015462000afb919062001cb3565b905060008183856002015462000b12919062001ccd565b62000b1e919062001d05565b905080846002015462000b32919062001cb3565b94505050505090565b6000807f1d99a33cbbd99d244d8804dd6e7f77acb60cc0c0934fe2f7b00cabddc4b4b0f8620009ba565b600062000b7162000b3b565b905062000b7f838362000bed565b62000b8b848262000d28565b50505050565b604080516001600160a01b0385811660248301528416604482015260648082018490528251808303909101815260849091019091526020810180516001600160e01b03166323b872dd60e01b17905262000b8b90859062000d48565b600081511162000c5f5760405162461bcd60e51b815260206004820152603660248201527f4c696247656f57656250617263656c3a2050617468206d757374206861766520604482015275185d081b19585cdd081bdb994818dbdb5c1bdb995b9d60521b6064820152608401620004c6565b7f1d99a33cbbd99d244d8804dd6e7f77acb60cc0c0934fe2f7b00cabddc4b4b0f862000c8e6000848462000e26565b60028101546000908152600180830160209081526040909220805467ffffffffffffffff19166001600160401b0387161781558451909262000cd79284019190860190620019bf565b5060028201546040517f10b9af39155ed127f01ba5cd8b7893608d2619511eece37bbf623781af4d70de90600090a2600182600201600082825462000d1d919062001bfc565b909155505050505050565b62000d448282604051806020016040528060008152506200108b565b5050565b600062000d9f826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b0316620010c59092919063ffffffff16565b80519091501562000e21578080602001905181019062000dc0919062001d1c565b62000e215760405162461bcd60e51b815260206004820152602a60248201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e6044820152691bdd081cdd58d8d9595960b21b6064820152608401620004c6565b505050565b60007f1d99a33cbbd99d244d8804dd6e7f77acb60cc0c0934fe2f7b00cabddc4b4b0f89050600083905060008084828151811062000e685762000e6862001d40565b60200260200101519050600080600062000e8b866001600160401b0316620010e0565b600083815260208b8152604080832085845290915290205492955090935091505b60008b600281111562000ec35762000ec362001d56565b0362000f505762000ed682600262001e6b565b81161562000f3c5760405162461bcd60e51b815260206004820152602c60248201527f4c696247656f57656250617263656c3a20436f6f7264696e617465206973206e60448201526b6f7420617661696c61626c6560a01b6064820152608401620004c6565b62000f4982600262001e6b565b1762000f80565b60018b600281111562000f675762000f6762001d56565b0362000f805760001962000f7d83600262001e6b565b18165b60008062000f8e876200117a565b985090925090508162000fed5762000fa860018962001bfc565b97508a51881062000fbb57505062001066565b8a888151811062000fd05762000fd062001d40565b6020026020010151965062000fe5876200117a565b985090925090505b600080620010086001600160401b038c16848a8a8a620011cf565b929d50919750925090508782141580620010225750868114155b156200105857600088815260208d815260408083208a84528252808320979097558382528d815286822083835290529490942054935b909650945062000eac915050565b6000938452602097885260408085209385529290975250902093909355505050505050565b620010978383620014bd565b620010a6600084848462001668565b62000e215760405162461bcd60e51b8152600401620004c69062001e79565b6060620010d6848460008562001777565b90505b9392505050565b600080600080620010f185620018b2565b6001600160401b031690506000620011098662001917565b6001600160401b031690506200112160108362001d05565b94506200113060108262001d05565b935060006200114160108462001ecb565b905060006200115260108462001ecb565b9050816200116282601062001ccd565b6200116e919062001bfc565b96989597505050505050565b60f881901c801515906000908190836200119c575060009150819050620011c8565b6003851692506001600160f81b03851660f8620011bb60018462001cb3565b901b600282901c17925050505b9193909250565b6000806000806000620011e28a620018b2565b90506000620011f18b62001917565b905089600003620012b8576200120960018262001ee2565b9050621fffff6001600160401b0382161115620012695760405162461bcd60e51b815260206004820152601d60248201527f446972656374696f6e2077656e7420746f6f20666172206e6f727468210000006044820152606401620004c6565b6200127660108262001f07565b6001600160401b0316600003620012ab576200129460018962001bfc565b9750620012a360f08862001cb3565b965062001498565b620012a360108862001bfc565b8960010362001372576000816001600160401b0316116200131c5760405162461bcd60e51b815260206004820152601d60248201527f446972656374696f6e2077656e7420746f6f2066617220736f757468210000006044820152606401620004c6565b6200132960018262001f30565b90506200133860108262001f07565b6001600160401b0316600f0362001365576200135660018962001cb3565b9750620012a360f08862001bfc565b620012a360108862001cb3565b89600203620013f957623fffff6001600160401b03831610620013a35760009850889150620012a3600f8862001cb3565b620013b060018362001ee2565b9150620013bf60108362001f07565b6001600160401b0316600003620013ec57620013dd60018a62001bfc565b9850620012a3600f8862001cb3565b620012a360018862001bfc565b896003036200149857816001600160401b03166000036200143f57623fffff91506200142760108362001f5b565b6001600160401b03169850620012a3600f8862001bfc565b6200144c60018362001f30565b91506200145b60108362001f07565b6001600160401b0316600f0362001488576200147960018a62001cb3565b9850620012a3600f8862001bfc565b6200149560018862001cb3565b96505b60209190911b6bffffffffffffffff0000000016179996985094965092949350505050565b6001600160a01b038216620015155760405162461bcd60e51b815260206004820181905260248201527f4552433732313a206d696e7420746f20746865207a65726f20616464726573736044820152606401620004c6565b60008181527f0a8995bbdd46f9746786f007089f3b619f2ad0fc5dfe298d61305940ef1ce25a60205260409020546001600160a01b0316156200159b5760405162461bcd60e51b815260206004820152601c60248201527f4552433732313a20746f6b656e20616c7265616479206d696e746564000000006044820152606401620004c6565b6001600160a01b03821660009081527f0a8995bbdd46f9746786f007089f3b619f2ad0fc5dfe298d61305940ef1ce25b6020526040812080547f0a8995bbdd46f9746786f007089f3b619f2ad0fc5dfe298d61305940ef1ce25892600192916200160790849062001bfc565b9091555050600082815260028201602052604080822080546001600160a01b0319166001600160a01b03871690811790915590518492907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef908290a4505050565b60006001600160a01b0384163b156200176b57604051630a85bd0160e11b81526001600160a01b0385169063150b7a0290620016af90339089908890889060040162001fb2565b6020604051808303816000875af1925050508015620016ed575060408051601f3d908101601f19168201909252620016ea9181019062001ff1565b60015b62001750573d8080156200171e576040519150601f19603f3d011682016040523d82523d6000602084013e62001723565b606091505b508051600003620017485760405162461bcd60e51b8152600401620004c69062001e79565b805181602001fd5b6001600160e01b031916630a85bd0160e11b1490506200176f565b5060015b949350505050565b606082471015620017da5760405162461bcd60e51b815260206004820152602660248201527f416464726573733a20696e73756666696369656e742062616c616e636520666f6044820152651c8818d85b1b60d21b6064820152608401620004c6565b6001600160a01b0385163b620018335760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e74726163740000006044820152606401620004c6565b600080866001600160a01b031685876040516200185191906200201d565b60006040518083038185875af1925050503d806000811462001890576040519150601f19603f3d011682016040523d82523d6000602084013e62001895565b606091505b5091509150620018a782828662001973565b979650505050505050565b63ffffffff602082901c16623fffff811115620019125760405162461bcd60e51b815260206004820152601d60248201527f5820636f6f7264696e617465206973206f7574206f6620626f756e64730000006044820152606401620004c6565b919050565b63ffffffff8116621fffff811115620019125760405162461bcd60e51b815260206004820152601d60248201527f5920636f6f7264696e617465206973206f7574206f6620626f756e64730000006044820152606401620004c6565b6060831562001984575081620010d9565b825115620019955782518084602001fd5b8160405162461bcd60e51b8152600401620004c691906200203b565b6103eb806200205183390190565b828054828255906000526020600020908101928215620019fd579160200282015b82811115620019fd578251825591602001919060010190620019e0565b5062001a0b92915062001a0f565b5090565b5b8082111562001a0b576000815560010162001a10565b6001600160a01b038116811462001a3c57600080fd5b50565b600080600080600060a0868803121562001a5857600080fd5b85359450602086013593506040860135925060608601359150608086013562001a818162001a26565b809150509295509295909350565b60006020828403121562001aa257600080fd5b5035919050565b634e487b7160e01b600052604160045260246000fd5b6000806000806080858703121562001ad657600080fd5b843580600b0b811462001ae857600080fd5b9350602085810135935060408601356001600160401b03808216821462001b0e57600080fd5b9093506060870135908082111562001b2557600080fd5b818801915088601f83011262001b3a57600080fd5b81358181111562001b4f5762001b4f62001aa9565b8060051b604051601f19603f8301168101818110858211171562001b775762001b7762001aa9565b60405291825284820192508381018501918b83111562001b9657600080fd5b938501935b8285101562001bb65784358452938501939285019262001b9b565b989b979a50959850505050505050565b60006020828403121562001bd957600080fd5b8135620010d98162001a26565b634e487b7160e01b600052601160045260246000fd5b6000821982111562001c125762001c1262001be6565b500190565b60006020828403121562001c2a57600080fd5b8151620010d98162001a26565b60006020828403121562001c4a57600080fd5b5051919050565b60005b8381101562001c6e57818101518382015260200162001c54565b8381111562000b8b5750506000910152565b6000835162001c9481846020880162001c51565b83519083019062001caa81836020880162001c51565b01949350505050565b60008282101562001cc85762001cc862001be6565b500390565b600081600019048311821515161562001cea5762001cea62001be6565b500290565b634e487b7160e01b600052601260045260246000fd5b60008262001d175762001d1762001cef565b500490565b60006020828403121562001d2f57600080fd5b81518015158114620010d957600080fd5b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052602160045260246000fd5b600181815b8085111562001dad57816000190482111562001d915762001d9162001be6565b8085161562001d9f57918102915b93841c939080029062001d71565b509250929050565b60008262001dc65750600162001e65565b8162001dd55750600062001e65565b816001811462001dee576002811462001df95762001e19565b600191505062001e65565b60ff84111562001e0d5762001e0d62001be6565b50506001821b62001e65565b5060208310610133831016604e8410600b841016171562001e3e575081810a62001e65565b62001e4a838362001d6c565b806000190482111562001e615762001e6162001be6565b0290505b92915050565b6000620010d9838362001db5565b60208082526032908201527f4552433732313a207472616e7366657220746f206e6f6e20455243373231526560408201527131b2b4bb32b91034b6b83632b6b2b73a32b960711b606082015260800190565b60008262001edd5762001edd62001cef565b500690565b60006001600160401b0380831681851680830382111562001caa5762001caa62001be6565b60006001600160401b038084168062001f245762001f2462001cef565b92169190910692915050565b60006001600160401b038381169083168181101562001f535762001f5362001be6565b039392505050565b60006001600160401b038084168062001f785762001f7862001cef565b92169190910492915050565b6000815180845262001f9e81602086016020860162001c51565b601f01601f19169290920160200192915050565b6001600160a01b038581168252841660208201526040810183905260806060820181905260009062001fe79083018462001f84565b9695505050505050565b6000602082840312156200200457600080fd5b81516001600160e01b031981168114620010d957600080fd5b600082516200203181846020870162001c51565b9190910192915050565b602081526000620010d9602083018462001f8456fe60806040526040516103eb3803806103eb8339810160408190526100229161013d565b6100358261004f60201b6101291760201c565b610048816100e460201b6101be1760201c565b5050610177565b7fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c132080546001600160a01b031981166001600160a01b038481169182179093556040517fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c939092169182907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a3505050565b7f5e00cdf5c1893326764dad3c20a33374e89545ec2d5f6a96396c2e00569864d680546001600160a01b0319166001600160a01b0392909216919091179055565b6001600160a01b038116811461013a57600080fd5b50565b6000806040838503121561015057600080fd5b825161015b81610125565b602084015190925061016c81610125565b809150509250929050565b610265806101866000396000f3fe60806040523661000b57005b60007f5e00cdf5c1893326764dad3c20a33374e89545ec2d5f6a96396c2e00569864d680546040516366ffd66360e11b8152600080356001600160e01b03191660048301529293506001600160a01b039091169063cdffacc690602401602060405180830381865afa158015610085573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906100a991906101ff565b90506001600160a01b0381166101055760405162461bcd60e51b815260206004820181905260248201527f4469616d6f6e643a2046756e6374696f6e20646f6573206e6f74206578697374604482015260640160405180910390fd5b3660008037600080366000845af43d6000803e808015610124573d6000f35b3d6000fd5b7fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c132080546001600160a01b031981166001600160a01b038481169182179093556040517fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c939092169182907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a3505050565b7f5e00cdf5c1893326764dad3c20a33374e89545ec2d5f6a96396c2e00569864d680546001600160a01b0319166001600160a01b0392909216919091179055565b60006020828403121561021157600080fd5b81516001600160a01b038116811461022857600080fd5b939250505056fea264697066735822122027f9d6cde67ee10d47e335027ec867b92970d80f4025786443b65ed748d6415864736f6c634300080e00333b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc23b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc1a26469706673582212209df2aae5934f0df07974c7ac13104a2d90c84620fc86777d119c8ce602cf7da464736f6c634300080e0033";

type PCOLicenseClaimerFacetConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: PCOLicenseClaimerFacetConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class PCOLicenseClaimerFacet__factory extends ContractFactory {
  constructor(...args: PCOLicenseClaimerFacetConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = "PCOLicenseClaimerFacet";
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<PCOLicenseClaimerFacet> {
    return super.deploy(overrides || {}) as Promise<PCOLicenseClaimerFacet>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): PCOLicenseClaimerFacet {
    return super.attach(address) as PCOLicenseClaimerFacet;
  }
  connect(signer: Signer): PCOLicenseClaimerFacet__factory {
    return super.connect(signer) as PCOLicenseClaimerFacet__factory;
  }
  static readonly contractName: "PCOLicenseClaimerFacet";
  public readonly contractName: "PCOLicenseClaimerFacet";
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): PCOLicenseClaimerFacetInterface {
    return new utils.Interface(_abi) as PCOLicenseClaimerFacetInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): PCOLicenseClaimerFacet {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as PCOLicenseClaimerFacet;
  }
}
