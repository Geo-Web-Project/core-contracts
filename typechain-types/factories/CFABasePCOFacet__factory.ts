/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  CFABasePCOFacet,
  CFABasePCOFacetInterface,
} from "../CFABasePCOFacet";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_payer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "int96",
        name: "contributionRate",
        type: "int96",
      },
    ],
    name: "PayerContributionRateUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "_payer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "forSalePrice",
        type: "uint256",
      },
    ],
    name: "PayerForSalePriceUpdated",
    type: "event",
  },
  {
    inputs: [],
    name: "contributionRate",
    outputs: [
      {
        internalType: "int96",
        name: "",
        type: "int96",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "currentBid",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "bidder",
            type: "address",
          },
          {
            internalType: "int96",
            name: "contributionRate",
            type: "int96",
          },
          {
            internalType: "uint256",
            name: "perSecondFeeNumerator",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "perSecondFeeDenominator",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "forSalePrice",
            type: "uint256",
          },
        ],
        internalType: "struct LibCFABasePCO.Bid",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "forSalePrice",
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
        internalType: "contract ICFABeneficiary",
        name: "beneficiary",
        type: "address",
      },
      {
        internalType: "contract IPCOLicenseParamsStore",
        name: "paramsStore",
        type: "address",
      },
      {
        internalType: "contract IERC721",
        name: "initLicense",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "initLicenseId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "bidder",
        type: "address",
      },
      {
        internalType: "int96",
        name: "newContributionRate",
        type: "int96",
      },
      {
        internalType: "uint256",
        name: "newForSalePrice",
        type: "uint256",
      },
    ],
    name: "initializeBid",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "isPayerBidActive",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "license",
    outputs: [
      {
        internalType: "contract IERC721",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "licenseId",
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
    name: "payer",
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
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50612ea6806100206000396000f3fe608060405234801561001057600080fd5b50600436106100885760003560e01c80636df38b841161005b5780636df38b84146101035780638d107ff5146101215780639190f8d31461013f578063def181011461015d57610088565b8063123119cd1461008d5780631355165f146100ab5780632c55dbed146100c75780636b87d24c146100e5575b600080fd5b61009561017b565b6040516100a291906128a9565b60405180910390f35b6100c560048036038101906100c091906128eb565b610290565b005b6100cf6114ae565b6040516100dc9190612977565b60405180910390f35b6100ed611541565b6040516100fa919061298a565b60405180910390f35b61010b611656565b60405161011891906129a3565b60405180910390f35b6101296116e9565b60405161013691906129b7565b60405180910390f35b6101476117de565b60405161015491906129b7565b60405180910390f35b6101656119f2565b60405161017291906129c8565b60405180910390f35b60006101a97fe25fd86e492d0761469d7b8800ab3a1d3fd47408ad4ef63f693184934120daa160001b611b8f565b6101d57f64607335ca2692ece9442cadc228e115627117579d71c3c4157eeb253f0e8eff60001b611b8f565b6102017f9fba8e5fea1cbcfcce412030e73fd07b4ac1d84fd96305f0314d0ff08b169fc560001b611b8f565b600061020b611b92565b90506102397f4c7fde5163403256389c7c614d21618a3a3b84d8827fc16fa3bc4418987219bd60001b611b8f565b6102657fe18071cdf3bbff3ef802541a76226f67cc2cb48732da9017cb07a41f798e22be60001b611b8f565b8060010160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1691505090565b6102bc7f89a6b6eb0a6a8b5ec4b9caf238be846faeccc66046b959ab6b24893b9c05279960001b611c70565b6102e87fa1c68b65130733427c70282da58c0db8283e7ca2cec299fa3089986ebb275f0560001b611c70565b6103147f345661c266031925207c2864caa46bf7577ea0828cfcb089b93a1413cfc4b2d760001b611c70565b6103407f2978fc03cb04a0047b650b7c629d8d27099e0cdf22cad45f7739e43a079db26260001b611c70565b610348611c73565b60000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146103d9576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016103d090612a17565b60405180910390fd5b6104057f9e14fad162337d04a3f7db6a7d100ac3c915f7f501702256b04b8c16eab1d08b60001b611c70565b6104317f72dc77dd447c9aa0f3652655df884f7ac1341b6a5351d185c9e74d95404a886e60001b611c70565b61045d7ff70f657e1d0e46957b927b043869e45f7c2d06781884983b7150afdad42e60b460001b611b8f565b6104897f9acd537864f863a793b5ea7514aac6f631306c436a4bc3f71de06a3f955aaf1360001b611b8f565b6104b57fc6ebab9624d87a59a3362b78b67ad468e08889f6af2408fd587ecd005f783cdb60001b611b8f565b60006104bf611ca0565b90506104ed7f64ba815957a66a4d8e8d7d7728fb2f5567c81f7bf620aaecd35b7b64d1c1f06360001b611b8f565b6105197f4227351922c0f383e3905e1a8c8f35c95ea79733d2fa990b43e32994dcc840e160001b611b8f565b868160000160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506105887f24b6a801569618aafcc8ff7b2736d0a28e42a31113c134f02c30bf321637cba060001b611b8f565b6105b47f7140ab4ae11b6c7ebec79a15757f9da966a15b4ae398494c113f59a813094e2060001b611b8f565b858160010160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506106237f14596edec1696d62bf84a88f517aae23a8e0e680860e567f409a787a4c12c42360001b611b8f565b61064f7f7d7731f19aac5ea3b3d78a1162835c21ab1977b4b51e5343eb5d94e80f737c3b60001b611b8f565b8481600201819055506106847f011fd3b4483c31928ff76d21050faf20e018f7bdfad00041192bd81a35cc58c160001b611b8f565b6106b07fbfef90e3a05c99645fce147535dc17325b7eb3542977fda9b0565a90f6b38c8a60001b611b8f565b878160030160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555061071f7f21cc0d2b22d87c1509674dbc558f7ecaa9ad63464c68ffba30b4c6b2f632698a60001b611b8f565b61074b7fa53135e2c4c74302ee2512960c40ab3e5d1e2f171a1802283a46ec1c865e28cc60001b611b8f565b6107777fcdb248f208c21ae73d3b7583b8bbf484964869bab75f9e6a285168fd01c36e7260001b611b8f565b8060000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663356248da6040518163ffffffff1660e01b8152600401602060405180830381865afa1580156107e6573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061080a9190612a55565b82101561084c576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161084390612a71565b60405180910390fd5b6108787fff2e8a3eee22729fbf8e183b8e11941f109c4e3f4d32cb1af9b06cb3f3f0e40460001b611b8f565b6108a47ff6ef0d0db905a02265b81e348ced9b070a4d44b59bdd5225bea7b614c23aa57c60001b611b8f565b6108d07fa8453a53b3736647de7fd6c68a847e12166dfba0c31a3d8d6eb815914e8f5f4660001b611b8f565b60008160000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166316a310266040518163ffffffff1660e01b8152600401602060405180830381865afa158015610941573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906109659190612a55565b90506109937f13c9016cd3578eb3be0912284ec91c32e7b73411a1f5ab9ae2b445f8ebec7bd260001b611b8f565b6109bf7ffe7af11e9892420b0697da7b521c80a2cd8144efe05d5ca870413e020b0cf9c860001b611b8f565b60008260000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663014df4146040518163ffffffff1660e01b8152600401602060405180830381865afa158015610a30573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610a549190612a55565b9050610a827fa017e47b157ead8d546c2c930d2de411b3e0f5ea1d72cc0cdb0f880942a991ec60001b611b8f565b610aae7f47a2731d5971e3ee0eb03a5e19eef676a9d89d57a104c0d1dab34ddbf5edc2bc60001b611b8f565b610ada7fe0acdf0beb1ac6b2cd68c6ab2ec9cef2741e263d33fc8295b061517b2edc342260001b611b8f565b610ae684868484611d7e565b610b25576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610b1c90612ad5565b60405180910390fd5b610b517f9623362dd616e447eb18581bbcdba536f980ab8e8297cdf8ffe79e02da73806860001b611b8f565b610b7d7ffa0fea82ae5b1e36d8712c40e1d4aace1cba78aaeff3d674bd76343a67532f0160001b611b8f565b610ba97f21e8521372fe9fb969d424a20f8b484dd314dd9e0093115b08373dc6f4d895d760001b611b8f565b6000610bb3611e93565b9050610be17f7d5770bb0340fb991e1748ac1cd2cabb51195d6ec2b9ff2d36d3b17545ec9a6360001b611b8f565b610c0d7f098b43f3a861b9d466ed5120f5b0aeaa95d33a237d44fd13d7730721e4e9b65460001b611b8f565b60008460000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166320bc44256040518163ffffffff1660e01b8152600401602060405180830381865afa158015610c7e573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610ca29190612b39565b9050610cd07ffa87881b66dcc1158274fb3f266095bdc143db11adb2629846b19e027dbec6c160001b611b8f565b610cfc7f95e7153b95498afd74110fe4e47f5ad9a6297d7b0a850db6b0e86ba746ccbce560001b611b8f565b60405180604001604052808273ffffffffffffffffffffffffffffffffffffffff1681526020018273ffffffffffffffffffffffffffffffffffffffff1663b6d200de7fa9214cc96615e0085d3bb077758db69497dc2dce3b2b1e97bc93c3d18d83efd36040518263ffffffff1660e01b8152600401610d7c9190612b60565b602060405180830381865afa158015610d99573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610dbd9190612b71565b73ffffffffffffffffffffffffffffffffffffffff168152508260000160008201518160000160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555060208201518160010160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550905050610e977f7432456ab18218959db8ecdb7def484410a831fa148fb4ade9ee07c96beb147460001b611b8f565b610ec37f05fa63a899ff77a83a5a7663b221441ca302308469dcb44ffea53a79437a557460001b611b8f565b60008560000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663d41c3a656040518163ffffffff1660e01b8152600401602060405180830381865afa158015610f34573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610f589190612b98565b9050610f867f4d2106d449842862a93fc1b9defa9fc6c3a67b8a1aca67f7a60cec5de37ac9ed60001b611b8f565b610fb27fa59716ac2a2e34239c2db1ed04500fd2e6ac7f3a846ee4bed5ddd81b8c8a4cf560001b611b8f565b6000610fbc611b92565b9050610fea7f0edff376cf88bfcd66b75dbd71b9485512891abb514f82d6844c05dfcaa8acbc60001b611b8f565b6110167f15b1a6542f8a6d420da1d14d5dbee2532107c869096db658f2178382be17c3f160001b611b8f565b42816000018190555061104b7fcf34b6501665140c7f0bbd61f7172805ff98cc3c2781408ee22f611af44f32e160001b611b8f565b6110777f195d50462f6d7367fdfc63858b61213faf324141fcd540444da5312e8295b0fd60001b611b8f565b898160010160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506110e67f96e418a334fd30107e4e60f01f06e94b9d1c44b76817de3fbc55aa15fed9dd7860001b611b8f565b6111127fe2290aca5be3df376d6d6bc1bcf482350d684cdfdf8463d6acb214ffce3d894960001b611b8f565b888160010160146101000a8154816bffffffffffffffffffffffff0219169083600b0b6bffffffffffffffffffffffff1602179055506111747f483930e58f56890d7048f4af30bc50c291103a00fe18fecbb41e6676cc90ade560001b611b8f565b6111a07f7aee671ae39bfc60de0097d959771b2347287647716fed427648eafccf5fb06e60001b611b8f565b8581600201819055506111d57fc9476167e8fe6dedd020717544013dfeebbbc1586ae166b3f9a10a5b708e951f60001b611b8f565b6112017fd151a2dd9d88ee4859fc52fec8a942621f6db016767b57b8ab7d56c440fa4e3d60001b611b8f565b8481600301819055506112367f73f51512273020a2a1bc16b79a76e25ca3b8849e886247df0dc5a0e635edd1b660001b611b8f565b6112627fc932f163b2c3cb638820fcaf15b3a4479396533102175391163f812d3dd05b4460001b611b8f565b8781600401819055506112977fb3e2024f528ab598248026634ef074030ae410911e2b1283bacaace12ad6167260001b611b8f565b6112c37f5451b464e330d9b7f9545ed878f96dafd3c0706ccb94fcf2575a94c4ad1b329360001b611b8f565b8973ffffffffffffffffffffffffffffffffffffffff167fae3c4f18410e9cfcd20fc8664a5a0082a92f07a0a5febdc22bec0c53939373368960405161130991906129b7565b60405180910390a261133d7f45db9d3836c8d137b630b0a8a8625560e4a266705206fc51c3c40c4d828341a260001b611b8f565b6113697f5be14b02f91242fd6b5d1cc6862c726c313e62036b582f48e71c1f4c21b2ff4760001b611b8f565b8973ffffffffffffffffffffffffffffffffffffffff167f6602f4d39e226f3807ddac3e7aab03883832e2ea2d07ccdeaf513c16679fdcd08a6040516113af91906129a3565b60405180910390a26113e37f9a02b8f9ed5658ea169fb9195f768217c14425aa6548e573aa8ad990b55e4e0660001b611b8f565b61140f7f27a60da1bbc7f710607a87cdfdcc40eb97e80d84ead812247a3db44d17d015a460001b611b8f565b61142b8a30848c88600001611f7190949392919063ffffffff16565b506114587f4b03b02de1b3ca627c5ee840073c4dfbd9c65491c187fb2d4e331b61cd3ce2d860001b611b8f565b6114847fe3c6d9fc8a6c58875679d57f886722b3b533fd8d3fa9069753fc7982193d90d160001b611b8f565b61149e8e838b87600001611fd9909392919063ffffffff16565b5050505050505050505050505050565b60006114dc7ffb54e4d5e21962c711efaf841b33a737753efaa76e39b926267fd3e72c06954460001b611b8f565b6115087f430215e0abc3d1b5c48bdf38c5d43f8a2f1cb7b06f15dd93452de17e5bf7ebea60001b611b8f565b6115347f4b56d9b11a0c9ac442e6b4ab7bb92b37a1216bc29b4dec3b6a53ebd883205acf60001b611b8f565b61153c612039565b905090565b600061156f7f20caeb94a516ab1ea9143395aa68f6b99fff62798e4dab127b7e2361802a45d360001b611b8f565b61159b7f6558fd0941ba9026b28d9430ab566187cb225bc85553cf1e9a98858de535672760001b611b8f565b6115c77fa9d6cd026f2c764304b38d6be8d514b79a8b4bc38036f7eac82062d42bb0176c60001b611b8f565b60006115d1611ca0565b90506115ff7f6400aaf1746eb291366e84ca596d67dc16bf2791d776cea75acfe92a9631a72e60001b611b8f565b61162b7f8cc4e46d8f507dd5ed03f48215a75fd2c8cded0964f4e837d67fa27b994fa55860001b611b8f565b8060010160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1691505090565b60006116847fedc6808668d94d5f73456461f1619467e99a732bce84a4893691137081d2314760001b611b8f565b6116b07f7b8b94f8ea1c03ee62ada3d3ef31848ea89e7ef39da98926461f992a9b5078b260001b611b8f565b6116dc7f7f43aabb926eb0cbbe89b0e359189de123feeec245af49eb82ca3f9bb4d8691b60001b611b8f565b6116e46120d2565b905090565b60006117177fd6b6523b8c3027b49095015adc9154c17f7ff5ef7575f107a29a9bbaa3e00c8a60001b611b8f565b6117437fde4e64cd2089659c18b419c3f50af39a9ed2f1066325ef751f4d0724ab50dd2b60001b611b8f565b61176f7fa268d2ac1762234970c32a2b099057e7fdf95e3a2c338514ea88203765cf00e060001b611b8f565b6000611779611ca0565b90506117a77f2c3b67d0cc8bd758c933d8699f3d047dd31a66fdef482d8cef2430fe23e9ea1f60001b611b8f565b6117d37fd73fe94e351a2fd450bd70fd9328b0647e382b31509be81d9daad5cd7160f34d60001b611b8f565b806002015491505090565b600061180c7fd0a183cdda67d5e851e911eed1ae4a967f59c77976a7591afa7bafdad77cde8e60001b611b8f565b6118387f787a5852fb9853f8bf6ef492774b2417b4422fa23800f0eb73960481a8c1938d60001b611b8f565b6118647f46e80544a3db1d42d58bc582bd67958ab755abe65594d97ecb9f230249d81d2c60001b611b8f565b61186c612039565b156119665761189d7f48dd4f2e41b40a761c0e5c8dfaa868ff13bcb599a3e220122fc0b09f14008e4e60001b611b8f565b6118c97f62a2e46a97dd3e18a49434d98a5fdd5be4e5c03231eb1d120d9538ac2407b16260001b611b8f565b6118f57fd4f3083bf6705b22d8c221df846bcc7cc5fa4561f0a247d526aaac8ba3877d0e60001b611b8f565b60006118ff611b92565b905061192d7f2e99f382434036e306293d2206c5f4eefab42a0bad31f7964f313d8d3addc08060001b611b8f565b6119597f6dd7f093dc4a03d97ab50eb2f611730ab90721043f1646517b9051e16d7837be60001b611b8f565b80600401549150506119ef565b6119927f5fced337681a71dc24bb8313f9f77e8afdbb01f78fc5e00d72f185eb22b68ab760001b611b8f565b6119be7fa612e72adc779259da1e3bda30d473527fdf52dc18ce2f39c616db735071fbd960001b611b8f565b6119ea7f63fdbe851ed6069c2932dc207066da579d7b230e009ac83d2f8d4cd60c25fd1a60001b611b8f565b600090505b90565b6119fa61285a565b611a267f4515a474437c760966c6576264c9a1b487cba610d36052becb9fc28aaf36140760001b611b8f565b611a527fefc5d19fc9bd6f5680e0de630df43b1cdec4942005df075e23707cd910c74b2b60001b611b8f565b611a7e7f7b5e5789545ab107fded6d1c2ff26c14bac6e4edc1914c7aef229282af7a827260001b611b8f565b6000611a88611b92565b9050611ab67f7ba17f03b9fccc4d6d3da04701d8a44e04d12097c2dd903a5fdcc41287d1a56d60001b611b8f565b611ae27fa81fde2a5a1c0f5b97e1feffe42915a1f93e0c64ff5b2a1efae43f9e4a73759c60001b611b8f565b806040518060c0016040529081600082015481526020016001820160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020016001820160149054906101000a9004600b0b600b0b600b0b8152602001600282015481526020016003820154815260200160048201548152505091505090565b50565b6000611bc07f6238a0ecd32b8f10c87577a74119e07b570907c8f6a59e920b03ddf7d9907c0160001b6123c6565b611bec7fe397a8ff868e6030ceca4fa61e93c3512ae60fe6c12e48877795294aecba0b7f60001b6123c6565b611c187f4a97e1229d5436aacb2ced047e922dd7d9a738ae07f212561c688c40db43060260001b6123c6565b60007f3c72d60a0f1018560e1ecd381dcc70c04920ba28255c0b6f8b496f8f6f727f419050611c697f04572ef72bed2a0febe4384f929436ef30d7c5515124f56af6ec6651e592dc7c60001b6123c6565b8091505090565b50565b6000807f8a22373512790c48b83a1fe2efdd2888d4a917bcdc24d0adf63e60f67168046090508091505090565b6000611cce7f50b55569cdbcd1f4d6155e95b65adf1ea2343906bc4a7593c8e8fd90d69581cb60001b6123c6565b611cfa7f2b6f1f2316740451875aa6c6d4d477ce0ee1ac79ca399714de0354845b25b85760001b6123c6565b611d267fd45ec0f9e546ed7fdede1cbcdaa6bbbde5abdeab0902903c64046a9b18b510c860001b6123c6565b60007f7afbdc140ed2feae39152d66ce3c9b7394a1bbd963c668f15d7196d48d2532c99050611d777fbc6191b29e1bf4a2f761f11fe13b8e370e0b373218d089c32e0b16a79de1b2d560001b6123c6565b8091505090565b6000611dac7fbc72b83933fe309e3be5cd13026c6d6add506ff04aa275ba29587be311eb4e3460001b6123c6565b611dd87f339fe8933c67584e16a53fd955ba8d11a83a6672b7984508976eb2a9138b1f0360001b6123c6565b611e047fa59ba70e2504e889f4b31cae87796f126726707f491742d149412927f434bcb660001b6123c6565b6000828487611e139190612bbf565b611e1d9190612bf2565b9050611e4b7f527e8c6db179e90401990d98c23c253e7728bff15cdce084b1f073ec329cec0960001b6123c6565b611e777fbc32e37c4fe7d70ed72afbecc31b77a085ad7bf7e9c3004d93f1316709f8d73f60001b6123c6565b846bffffffffffffffffffffffff168114915050949350505050565b6000611ec17f0de8613132fd703f22d486e81aa4a863754f5495a54a693300ef202de81e043760001b6123c6565b611eed7fcd0a6028ddf933bc069c8c0ca4bb45da09c3006d46bbe8c3aa858ae1384f3c6160001b6123c6565b611f197f4557fd71a7e064bed8a69a98553556f9a6f30e525131d4a72ef4c407a384779460001b6123c6565b60007feaf1cf088be31249661a61fc7743edf628a39210375613d4be0a9cda3ec06da69050611f6a7fb0c66eb3115c84cf7a68c0dcaeeb6dfa44b5dfa009c80a59b927aa81c897ea9060001b6123c6565b8091505090565b6060611fce8686868686600067ffffffffffffffff811115611f9657611f95612c1a565b5b6040519080825280601f01601f191660200182016040528015611fc85781602001600182028036833780820191505090505b506123c9565b905095945050505050565b61203384848484600067ffffffffffffffff811115611ffb57611ffa612c1a565b5b6040519080825280601f01601f19166020018201604052801561202d5781602001600182028036833780820191505090505b5061258b565b50505050565b60006120677f4806caf027abd30ee2dfeaf9294f80b803f77a20cf19ec50ee4453d5e754c58c60001b6123c6565b6120937ff5df7cc44cca3fa71d79bb123e49f5599e423fed9af61d73165494e6605964a260001b6123c6565b6120bf7fdd3705c22f095867cf6f457e7a3c6cb7e0baaa14dae4922e8b1c88890297cf8e60001b6123c6565b60006120c96120d2565b600b0b13905090565b60006121007fc2a2b97c4cbf1882f5b7386832cf4a488425143d489e4f756d91bb9c0bcf350360001b6123c6565b61212c7f38bab9f05a8a77dd39fb5e19fadbf8f86160de56b4504e0aea861b584989a1b260001b6123c6565b6121587f59fe7175daa9a04c3ca62ad10c86bfcb5f618399a6afb16adb4a91b5004ae01260001b6123c6565b6000612162611ca0565b90506121907f350e29e6e3c79bb5553d4e35e79bf8c076912ff0f00fad547266f3a08e38d85060001b6123c6565b6121bc7f6966f6db5f99505bd0592975250f48d61fc4e1e2be16eea84a71567c144ff69560001b6123c6565b60006121c6611e93565b90506121f47f3c91da3fc3d6ad5085b7bd1833aaf26e4b6bf7636b299aeee6af31c78d5a2b8d60001b6123c6565b6122207f809602737b107dfc44900c7544a50f8a7b212f302281164199e35b64ac6a560060001b6123c6565b60008160000160010160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663e6a1e8888460000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1663d41c3a656040518163ffffffff1660e01b8152600401602060405180830381865afa1580156122d4573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906122f89190612b98565b30612301612745565b6040518463ffffffff1660e01b815260040161231f93929190612c30565b608060405180830381865afa15801561233c573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906123609190612c5d565b50509150506123917f972da57f48cf1abd4cd76ce5c3038de7874a54063163ea71ba33059a363d4c8560001b6123c6565b6123bd7fb34673d5c987179b9f04717fa480a5970c7b8692413b9bcceeaea4963322dd6f60001b6123c6565b80935050505090565b50565b60608660000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166339255d5b8860010160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff168960010160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166394229ecb888b8b8a600067ffffffffffffffff81111561248f5761248e612c1a565b5b6040519080825280601f01601f1916602001820160405280156124c15781602001600182028036833780820191505090505b506040516024016124d6959493929190612cf8565b604051602081830303815290604052915060e01b6020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff8381831617835250505050856040518463ffffffff1660e01b815260040161253793929190612d40565b6000604051808303816000875af1158015612556573d6000803e3d6000fd5b505050506040513d6000823e3d601f19601f8201168201806040525081019061257f9190612d7e565b90509695505050505050565b8460000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166339255d5b8660010160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff168760010160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166362fc305e878988600067ffffffffffffffff81111561264e5761264d612c1a565b5b6040519080825280601f01601f1916602001820160405280156126805781602001600182028036833780820191505090505b506040516024016126949493929190612e31565b604051602081830303815290604052915060e01b6020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff8381831617835250505050846040518463ffffffff1660e01b81526004016126f593929190612d40565b6000604051808303816000875af1158015612714573d6000803e3d6000fd5b505050506040513d6000823e3d601f19601f8201168201806040525081019061273d9190612d7e565b505050505050565b60006127737ff818196bc591e9842986d88a194a400e63274246ef7ac44f67854eab17bccbb960001b6123c6565b61279f7ff81ebc859c2b6ba3fae4f210ee6afa2a5196c716c9bda8f6d24e191796a2752660001b6123c6565b6127cb7fc97385cf22d2d456e3c89309661dfe761719fc0217f56abb9838f97e6dfd6a9e60001b6123c6565b60006127d5611ca0565b90506128037f0855c05b33fe39c630b31127a38f1c5aa2a5f877bd856d7a9afe1228ef32167360001b6123c6565b61282f7f93a52aa1ca34b92c6e856af679bcb519c27a9606cfa06fd839b473ca582b4ee560001b6123c6565b8060030160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1691505090565b6040518060c0016040528060008152602001600073ffffffffffffffffffffffffffffffffffffffff1681526020016000600b0b81526020016000815260200160008152602001600081525090565b600060208201905060018060a01b038316825292915050565b60018060a01b03811681146128d657600080fd5b50565b80600b0b81146128e857600080fd5b50565b600080600080600080600060e0888a03121561290657600080fd5b8735612911816128c2565b809750506020880135612923816128c2565b809650506040880135612935816128c2565b8095505060608801359350608088013561294e816128c2565b8093505060a0880135612960816128d9565b8092505060c0880135905092959891949750929550565b6000602082019050821515825292915050565b600060208201905060018060a01b038316825292915050565b600060208201905082600b0b825292915050565b600060208201905082825292915050565b600060c0820190508251825260018060a01b0360208401511660208301526040830151600b0b6040830152606083015160608301526080830151608083015260a083015160a083015292915050565b60208152601d60208201527f4f776e61626c653a2073656e646572206d757374206265206f776e657200000060408201526000606082019050919050565b600060208284031215612a6757600080fd5b8151905092915050565b60208152602f60208201527f4346414261736550434f46616365743a204d696e696d756d20666f722073616c60408201527f65207072696365206e6f74206d6574000000000000000000000000000000000060608201526000608082019050919050565b60208152602960208201527f4346414261736550434f46616365743a20496e636f727265637420666f72207360408201527f616c65207072696365000000000000000000000000000000000000000000000060608201526000608082019050919050565b600060208284031215612b4b57600080fd5b8151612b56816128c2565b8091505092915050565b600060208201905082825292915050565b600060208284031215612b8357600080fd5b8151612b8e816128c2565b8091505092915050565b600060208284031215612baa57600080fd5b8151612bb5816128c2565b8091505092915050565b6000816000190483118215151615612be757634e487b7160e01b600052601160045260246000fd5b828202905092915050565b600082612c0f57634e487b7160e01b600052601260045260246000fd5b828204905092915050565b634e487b7160e01b600052604160045260246000fd5b600060608201905060018060a01b0380861683528085166020840152808416604084015250949350505050565b60008060008060808587031215612c7357600080fd5b845193506020850151612c85816128d9565b80935050604085015191506060850151905092959194509250565b60005b83811015612cbe578082015181840152602081019050612ca3565b50600083830152505050565b60008151808452612ce2816020860160208601612ca0565b6020601f19601f83011685010191505092915050565b600060018060a01b038088168352808716602084015280861660408401525083600b0b606083015260a06080830152612d3460a0830184612cca565b90509695505050505050565b60018060a01b0384168152606060208201526000612d616060830185612cca565b8281036040840152612d738185612cca565b915050949350505050565b600060208284031215612d9057600080fd5b815167ffffffffffffffff80821115612da857600080fd5b818401915084601f830112612dbc57600080fd5b815181811115612dcf57612dce612c1a565b5b601f1960405181603f83601f8601160116810191508082108483111715612df957612df8612c1a565b5b81604052828152876020848701011115612e1257600080fd5b612e23836020830160208801612ca0565b809550505050505092915050565b600060018060a01b03808716835280861660208401525083600b0b604083015260806060830152612e656080830184612cca565b90509594505050505056fea264697066735822122079c46f0f735da7eeb26bea8711bffa5df77921ba696bab46eed92c52853f13cc64736f6c63430008100033";

type CFABasePCOFacetConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: CFABasePCOFacetConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class CFABasePCOFacet__factory extends ContractFactory {
  constructor(...args: CFABasePCOFacetConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = "CFABasePCOFacet";
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<CFABasePCOFacet> {
    return super.deploy(overrides || {}) as Promise<CFABasePCOFacet>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): CFABasePCOFacet {
    return super.attach(address) as CFABasePCOFacet;
  }
  connect(signer: Signer): CFABasePCOFacet__factory {
    return super.connect(signer) as CFABasePCOFacet__factory;
  }
  static readonly contractName: "CFABasePCOFacet";
  public readonly contractName: "CFABasePCOFacet";
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): CFABasePCOFacetInterface {
    return new utils.Interface(_abi) as CFABasePCOFacetInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): CFABasePCOFacet {
    return new Contract(address, _abi, signerOrProvider) as CFABasePCOFacet;
  }
}
