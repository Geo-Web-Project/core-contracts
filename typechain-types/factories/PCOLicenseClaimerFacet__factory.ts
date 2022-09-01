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
        name: "_auctionEnd",
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
        name: "_auctionStart",
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
  "0x608060405234801561001057600080fd5b50612472806100206000396000f3fe60806040523480156200001157600080fd5b5060043610620001085760003560e01c8063644e979711620000a357806398dec6cc116200006e57806398dec6cc14620002515780639fcbf16b146200029c578063c250dc8b14620002b3578063d42afb5614620002db57600080fd5b8063644e979714620001e4578063738ce0ca14620001fb57806385c04d7a146200021257806387dc0c55146200023a57600080fd5b80631cbb2ce311620000e45780631cbb2ce314620001545780632d6b3a6b146200016b57806331b2ab2614620001b45780635ced333414620001cb57600080fd5b8062e8842c146200010d5780630556e9b91462000126578063181f4456146200013d575b600080fd5b620001246200011e36600462001a00565b620002f2565b005b620001246200013736600462001a50565b620003a8565b620001246200014e36600462001a50565b620003d6565b620001246200016536600462001a50565b620003f3565b7f3b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc5546001600160a01b03165b6040516001600160a01b0390911681526020015b60405180910390f35b62000124620001c536600462001a80565b62000421565b620001d56200081b565b604051908152602001620001ab565b6000805160206200241d83398151915254620001d5565b620001246200020c36600462001a50565b6200082c565b7f3b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc454620001d5565b600080516020620023fd83398151915254620001d5565b620001976200026236600462001a50565b60009081527f3b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc660205260409020546001600160a01b031690565b62000197620002ad36600462001b87565b62000849565b7f3b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc354620001d5565b62000124620002ec36600462001b87565b620009b1565b620002fc620009fc565b6000805160206200241d83398151915294909455600080516020620023fd833981519152929092557f3b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc3557f3b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc4557f3b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc580546001600160a01b0319166001600160a01b03909216919091179055565b620003b2620009fc565b7f3b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc355565b620003e0620009fc565b6000805160206200241d83398151915255565b620003fd620009fc565b7f3b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc455565b6000805160206200241d8339815191527f6ee8bf8f33d87ee8fc792bdab0fa8c5d1fb2132b416aab215664bf4732bc299760006200045e62000a87565b905080861015620004ed5760405162461bcd60e51b815260206004820152604860248201527f50434f4c6963656e7365436c61696d657246616365743a20496e697469616c2060448201527f666f722073616c6520707269636520646f6573206e6f74206d656574207265716064820152671d5a5c995b595b9d60c21b608482015260a4015b60405180910390fd5b826001015442116200051b57815460018301546200051b916001600160a01b03918216913391168962000b28565b60006200052a33878762000b8a565b336000818152600687016020908152604080832054905194955091936200056b9392910160609290921b6001600160601b0319168252601482015260340190565b60408051601f198184030181529082905280516020909101206004870154909130916001600160a01b031690620005a29062001972565b6001600160a01b039283168152911660208201526040018190604051809103906000f5905080158015620005da573d6000803e3d6000fd5b50336000908152600687016020526040812080549293506001929091906200060490849062001bbd565b9091555050600082815260058601602052604080822080546001600160a01b0319166001600160a01b038581169190911790915560028701549151635b69006f60e11b81527fa9214cc96615e0085d3bb077758db69497dc2dce3b2b1e97bc93c3d18d83efd3600482015291169063b6d200de90602401602060405180830381865afa15801562000699573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190620006bf919062001bd8565b60018601546040516346ccbfb760e11b81526001600160a01b039182166004820152600b8d900b602482015291925060009190831690638d997f6e90604401602060405180830381865afa1580156200071c573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019062000742919062001bf8565b600187015490915062000761906001600160a01b031633858462000b28565b505060405163cdd42e9560e01b81523060048201819052602482015260448101839052336064820152600b8a900b608482015260a481018990526001600160a01b0382169063cdd42e959060c401600060405180830381600087803b158015620007ca57600080fd5b505af1158015620007df573d6000803e3d6000fd5b50506040513392508491507f97c7a37a01ea09716c8cd03bacec8d6db1e30927bfa2ff373e434b074f81775f90600090a3505050505050505050565b60006200082762000a87565b905090565b62000836620009fc565b600080516020620023fd83398151915255565b6001600160a01b03811660009081527f3b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc7602090815260408083205490516001600160601b0319606086901b169281019290925260348201526000805160206200241d833981519152906001600160f81b03199030906054016040516020818303038152906040528051906020012060405180602001620008e99062001972565b601f1982820381018352601f90910116604081815260048701543060208401526001600160a01b03169082015260600160408051601f198184030181529082905262000939929160200162001c41565b604051602081830303815290604052805190602001206040516020016200099294939291906001600160f81b031994909416845260609290921b6001600160601b03191660018401526015830152603582015260550190565b60408051601f1981840301815291905280516020909101209392505050565b620009bb620009fc565b7f3b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc580546001600160a01b0319166001600160a01b0392909216919091179055565b7fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c600401546001600160a01b0316331462000a855760405162461bcd60e51b815260206004820152602260248201527f4c69624469616d6f6e643a204d75737420626520636f6e7472616374206f776e60448201526132b960f11b6064820152608401620004e4565b565b600080516020620023fd833981519152546000906000805160206200241d8339815191529042111562000abd5760030154919050565b805460009062000ace904262001c74565b905060008260000154836001015462000ae8919062001c74565b905060008183856002015462000aff919062001c8e565b62000b0b919062001cc6565b905080846002015462000b1f919062001c74565b94505050505090565b604080516001600160a01b0385811660248301528416604482015260648082018490528251808303909101815260849091019091526020810180516001600160e01b03166323b872dd60e01b17905262000b8490859062000bad565b50505050565b600062000b98838362000c8b565b905062000ba6848262000dcc565b9392505050565b600062000c04826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b031662000dec9092919063ffffffff16565b80519091501562000c86578080602001905181019062000c25919062001cdd565b62000c865760405162461bcd60e51b815260206004820152602a60248201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e6044820152691bdd081cdd58d8d9595960b21b6064820152608401620004e4565b505050565b60008082511162000cfe5760405162461bcd60e51b815260206004820152603660248201527f4c696247656f57656250617263656c3a2050617468206d757374206861766520604482015275185d081b19585cdd081bdb994818dbdb5c1bdb995b9d60521b6064820152608401620004e4565b7f1d99a33cbbd99d244d8804dd6e7f77acb60cc0c0934fe2f7b00cabddc4b4b0f862000d2d6000858562000e05565b60028101546000908152600180830160209081526040909220805467ffffffffffffffff19166001600160401b0388161781558551909262000d76928401919087019062001980565b5060028201546040517f10b9af39155ed127f01ba5cd8b7893608d2619511eece37bbf623781af4d70de90600090a26002820180549350600190600062000dbe838762001bbd565b909155509295945050505050565b62000de88282604051806020016040528060008152506200106a565b5050565b606062000dfd8484600085620010a4565b949350505050565b60007f1d99a33cbbd99d244d8804dd6e7f77acb60cc0c0934fe2f7b00cabddc4b4b0f89050600083905060008084828151811062000e475762000e4762001d01565b60200260200101519050600080600062000e6a866001600160401b0316620011df565b600083815260208b8152604080832085845290915290205492955090935091505b60008b600281111562000ea25762000ea262001d17565b0362000f2f5762000eb582600262001e2c565b81161562000f1b5760405162461bcd60e51b815260206004820152602c60248201527f4c696247656f57656250617263656c3a20436f6f7264696e617465206973206e60448201526b6f7420617661696c61626c6560a01b6064820152608401620004e4565b62000f2882600262001e2c565b1762000f5f565b60018b600281111562000f465762000f4662001d17565b0362000f5f5760001962000f5c83600262001e2c565b18165b60008062000f6d8762001279565b985090925090508162000fcc5762000f8760018962001bbd565b97508a51881062000f9a57505062001045565b8a888151811062000faf5762000faf62001d01565b6020026020010151965062000fc48762001279565b985090925090505b60008062000fe76001600160401b038c16848a8a8a620012ce565b929d50919750925090508782141580620010015750868114155b156200103757600088815260208d815260408083208a84528252808320979097558382528d815286822083835290529490942054935b909650945062000e8b915050565b6000938452602097885260408085209385529290975250902093909355505050505050565b620010768383620015bc565b62001085600084848462001767565b62000c865760405162461bcd60e51b8152600401620004e49062001e3a565b606082471015620011075760405162461bcd60e51b815260206004820152602660248201527f416464726573733a20696e73756666696369656e742062616c616e636520666f6044820152651c8818d85b1b60d21b6064820152608401620004e4565b6001600160a01b0385163b620011605760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e74726163740000006044820152606401620004e4565b600080866001600160a01b031685876040516200117e919062001e8c565b60006040518083038185875af1925050503d8060008114620011bd576040519150601f19603f3d011682016040523d82523d6000602084013e620011c2565b606091505b5091509150620011d482828662001873565b979650505050505050565b600080600080620011f085620018b1565b6001600160401b031690506000620012088662001916565b6001600160401b031690506200122060108362001cc6565b94506200122f60108262001cc6565b935060006200124060108462001eaa565b905060006200125160108462001eaa565b9050816200126182601062001c8e565b6200126d919062001bbd565b96989597505050505050565b60f881901c801515906000908190836200129b575060009150819050620012c7565b6003851692506001600160f81b03851660f8620012ba60018462001c74565b901b600282901c17925050505b9193909250565b6000806000806000620012e18a620018b1565b90506000620012f08b62001916565b905089600003620013b7576200130860018262001ec1565b9050621fffff6001600160401b0382161115620013685760405162461bcd60e51b815260206004820152601d60248201527f446972656374696f6e2077656e7420746f6f20666172206e6f727468210000006044820152606401620004e4565b6200137560108262001ee6565b6001600160401b0316600003620013aa576200139360018962001bbd565b9750620013a260f08862001c74565b965062001597565b620013a260108862001bbd565b8960010362001471576000816001600160401b0316116200141b5760405162461bcd60e51b815260206004820152601d60248201527f446972656374696f6e2077656e7420746f6f2066617220736f757468210000006044820152606401620004e4565b6200142860018262001f0f565b90506200143760108262001ee6565b6001600160401b0316600f0362001464576200145560018962001c74565b9750620013a260f08862001bbd565b620013a260108862001c74565b89600203620014f857623fffff6001600160401b03831610620014a25760009850889150620013a2600f8862001c74565b620014af60018362001ec1565b9150620014be60108362001ee6565b6001600160401b0316600003620014eb57620014dc60018a62001bbd565b9850620013a2600f8862001c74565b620013a260018862001bbd565b896003036200159757816001600160401b03166000036200153e57623fffff91506200152660108362001f3a565b6001600160401b03169850620013a2600f8862001bbd565b6200154b60018362001f0f565b91506200155a60108362001ee6565b6001600160401b0316600f0362001587576200157860018a62001c74565b9850620013a2600f8862001bbd565b6200159460018862001c74565b96505b60209190911b6bffffffffffffffff0000000016179996985094965092949350505050565b6001600160a01b038216620016145760405162461bcd60e51b815260206004820181905260248201527f4552433732313a206d696e7420746f20746865207a65726f20616464726573736044820152606401620004e4565b60008181527f0a8995bbdd46f9746786f007089f3b619f2ad0fc5dfe298d61305940ef1ce25a60205260409020546001600160a01b0316156200169a5760405162461bcd60e51b815260206004820152601c60248201527f4552433732313a20746f6b656e20616c7265616479206d696e746564000000006044820152606401620004e4565b6001600160a01b03821660009081527f0a8995bbdd46f9746786f007089f3b619f2ad0fc5dfe298d61305940ef1ce25b6020526040812080547f0a8995bbdd46f9746786f007089f3b619f2ad0fc5dfe298d61305940ef1ce25892600192916200170690849062001bbd565b9091555050600082815260028201602052604080822080546001600160a01b0319166001600160a01b03871690811790915590518492907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef908290a4505050565b60006001600160a01b0384163b156200186a57604051630a85bd0160e11b81526001600160a01b0385169063150b7a0290620017ae90339089908890889060040162001f91565b6020604051808303816000875af1925050508015620017ec575060408051601f3d908101601f19168201909252620017e99181019062001fd0565b60015b6200184f573d8080156200181d576040519150601f19603f3d011682016040523d82523d6000602084013e62001822565b606091505b508051600003620018475760405162461bcd60e51b8152600401620004e49062001e3a565b805181602001fd5b6001600160e01b031916630a85bd0160e11b14905062000dfd565b50600162000dfd565b606083156200188457508162000ba6565b825115620018955782518084602001fd5b8160405162461bcd60e51b8152600401620004e4919062001ffc565b63ffffffff602082901c16623fffff811115620019115760405162461bcd60e51b815260206004820152601d60248201527f5820636f6f7264696e617465206973206f7574206f6620626f756e64730000006044820152606401620004e4565b919050565b63ffffffff8116621fffff811115620019115760405162461bcd60e51b815260206004820152601d60248201527f5920636f6f7264696e617465206973206f7574206f6620626f756e64730000006044820152606401620004e4565b6103eb806200201283390190565b828054828255906000526020600020908101928215620019be579160200282015b82811115620019be578251825591602001919060010190620019a1565b50620019cc929150620019d0565b5090565b5b80821115620019cc5760008155600101620019d1565b6001600160a01b0381168114620019fd57600080fd5b50565b600080600080600060a0868803121562001a1957600080fd5b85359450602086013593506040860135925060608601359150608086013562001a4281620019e7565b809150509295509295909350565b60006020828403121562001a6357600080fd5b5035919050565b634e487b7160e01b600052604160045260246000fd5b6000806000806080858703121562001a9757600080fd5b843580600b0b811462001aa957600080fd5b9350602085810135935060408601356001600160401b03808216821462001acf57600080fd5b9093506060870135908082111562001ae657600080fd5b818801915088601f83011262001afb57600080fd5b81358181111562001b105762001b1062001a6a565b8060051b604051601f19603f8301168101818110858211171562001b385762001b3862001a6a565b60405291825284820192508381018501918b83111562001b5757600080fd5b938501935b8285101562001b775784358452938501939285019262001b5c565b989b979a50959850505050505050565b60006020828403121562001b9a57600080fd5b813562000ba681620019e7565b634e487b7160e01b600052601160045260246000fd5b6000821982111562001bd35762001bd362001ba7565b500190565b60006020828403121562001beb57600080fd5b815162000ba681620019e7565b60006020828403121562001c0b57600080fd5b5051919050565b60005b8381101562001c2f57818101518382015260200162001c15565b8381111562000b845750506000910152565b6000835162001c5581846020880162001c12565b83519083019062001c6b81836020880162001c12565b01949350505050565b60008282101562001c895762001c8962001ba7565b500390565b600081600019048311821515161562001cab5762001cab62001ba7565b500290565b634e487b7160e01b600052601260045260246000fd5b60008262001cd85762001cd862001cb0565b500490565b60006020828403121562001cf057600080fd5b8151801515811462000ba657600080fd5b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052602160045260246000fd5b600181815b8085111562001d6e57816000190482111562001d525762001d5262001ba7565b8085161562001d6057918102915b93841c939080029062001d32565b509250929050565b60008262001d875750600162001e26565b8162001d965750600062001e26565b816001811462001daf576002811462001dba5762001dda565b600191505062001e26565b60ff84111562001dce5762001dce62001ba7565b50506001821b62001e26565b5060208310610133831016604e8410600b841016171562001dff575081810a62001e26565b62001e0b838362001d2d565b806000190482111562001e225762001e2262001ba7565b0290505b92915050565b600062000ba6838362001d76565b60208082526032908201527f4552433732313a207472616e7366657220746f206e6f6e20455243373231526560408201527131b2b4bb32b91034b6b83632b6b2b73a32b960711b606082015260800190565b6000825162001ea081846020870162001c12565b9190910192915050565b60008262001ebc5762001ebc62001cb0565b500690565b60006001600160401b0380831681851680830382111562001c6b5762001c6b62001ba7565b60006001600160401b038084168062001f035762001f0362001cb0565b92169190910692915050565b60006001600160401b038381169083168181101562001f325762001f3262001ba7565b039392505050565b60006001600160401b038084168062001f575762001f5762001cb0565b92169190910492915050565b6000815180845262001f7d81602086016020860162001c12565b601f01601f19169290920160200192915050565b6001600160a01b038581168252841660208201526040810183905260806060820181905260009062001fc69083018462001f63565b9695505050505050565b60006020828403121562001fe357600080fd5b81516001600160e01b03198116811462000ba657600080fd5b60208152600062000ba6602083018462001f6356fe60806040526040516103eb3803806103eb8339810160408190526100229161013d565b6100358261004f60201b6101291760201c565b610048816100e460201b6101be1760201c565b5050610177565b7fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c132080546001600160a01b031981166001600160a01b038481169182179093556040517fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c939092169182907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a3505050565b7f5e00cdf5c1893326764dad3c20a33374e89545ec2d5f6a96396c2e00569864d680546001600160a01b0319166001600160a01b0392909216919091179055565b6001600160a01b038116811461013a57600080fd5b50565b6000806040838503121561015057600080fd5b825161015b81610125565b602084015190925061016c81610125565b809150509250929050565b610265806101866000396000f3fe60806040523661000b57005b60007f5e00cdf5c1893326764dad3c20a33374e89545ec2d5f6a96396c2e00569864d680546040516366ffd66360e11b8152600080356001600160e01b03191660048301529293506001600160a01b039091169063cdffacc690602401602060405180830381865afa158015610085573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906100a991906101ff565b90506001600160a01b0381166101055760405162461bcd60e51b815260206004820181905260248201527f4469616d6f6e643a2046756e6374696f6e20646f6573206e6f74206578697374604482015260640160405180910390fd5b3660008037600080366000845af43d6000803e808015610124573d6000f35b3d6000fd5b7fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c132080546001600160a01b031981166001600160a01b038481169182179093556040517fc8fcad8db84d3cc18b4c41d551ea0ee66dd599cde068d998e57d5e09332c131c939092169182907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a3505050565b7f5e00cdf5c1893326764dad3c20a33374e89545ec2d5f6a96396c2e00569864d680546001600160a01b0319166001600160a01b0392909216919091179055565b60006020828403121561021157600080fd5b81516001600160a01b038116811461022857600080fd5b939250505056fea2646970667358221220fa26deb6877612b343376352fc4dc48f499847386bd6bc5a0bf415b7f864360864736f6c634300080e00333b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc23b663854d6275cb61693c120edcaa0245b186f0d96cfc1f673910ff9abaa8bc1a26469706673582212207df97dcfb2762fbec91928ec1542e6c2180fadc05a418678157cc17bb0f35f7f64736f6c634300080e0033";

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
