import { useState } from "react";
import {
  useAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useWriteContract,
} from "wagmi";
import { parseEther } from "viem";
import { Toaster, toast } from "react-hot-toast";
import { waitForTransactionReceipt } from "wagmi/actions";

const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }]
  },
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }]
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }]
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    name: "transferFrom",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "sender", type: "address" },
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    name: "Transfer",
    type: "event",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false }
    ]
  },
  {
    name: "Approval",
    type: "event",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "spender", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false }
    ]
  }
];

const TESTNET_TOKENS = {
  USDT: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
  BUSD: "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee",
};

function App() {
  const [recipientAddress, setRecipientAddress] = useState("0xF4F175C6AACbC1c8C8436EEd30350eA1473e3923");
  const [amount, setAmount] = useState("2");
  const [tokenAddress, setTokenAddress] = useState(TESTNET_TOKENS.BUSD);

  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address,
  });
  const { data: tokenBalance } = useBalance({
    address,
    token: tokenAddress,
  });

  const { writeContract } = useWriteContract();

  const handleTransferBNB = async () => {
    if (!recipientAddress || !amount) return;
    try {
      await writeContract({
        abi: [
          {
            name: "transfer",
            type: "function",
            stateMutability: "payable",
            inputs: [],
            outputs: [],
          },
        ],
        address: recipientAddress,
        functionName: "transfer",
        value: parseEther(amount),
      });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleTransferToken = async () => {
    // Validate token selection
    if (!tokenAddress) {
      toast.error("Please select a token ERC20");
      return;
    }
    // Validate recipient address
    if (!recipientAddress || !/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
      toast.error("Please enter a valid recipient address");
      return;
    }
    // Validate amount
    // if (!amount || amount <= 0) {
    //   toast.error('Please enter an amount')
    //   return
    // }

    try {
      const { hash } = await writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [recipientAddress, parseEther(amount)],
      });

      // Show pending toast
      toast.loading("Transaction pending...", { id: hash });

      // Wait for transaction confirmation
 
      const receipt = await waitForTransactionReceipt({ hash });

      if (receipt.status === "success") {
        toast.success("Transfer successful!", { id: hash });
      } else {
        toast.error("Transfer failed", { id: hash });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Transfer failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#333',
          color: '#fff',
        },
      }} />
      
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Web3 Transfer</h1>
 
        {!isConnected ? (
          <div className="text-center">
            <button
              onClick={() => {
                connect({ connector: connectors[0] });
                
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              Connect Wallet
            </button>
            <p className="mt-4 text-gray-400">Connect your wallet to start transferring tokens</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Wallet Info Card */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Wallet Info</h2>
                <button
                  onClick={() => disconnect()}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Disconnect
                </button>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-gray-400">Address</p>
                  <p className="text-sm font-mono break-all">{address}</p>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-400">BNB Balance</p>
                    <p className="text-xl font-semibold">{balance?.formatted || "0"} BNB</p>
                  </div>
                  {tokenAddress && (
                    <div className="text-right">
                      <p className="text-gray-400">Token Balance</p>
                      <p className="text-xl font-semibold">
                        {tokenBalance?.formatted || "0"} {tokenBalance?.symbol}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Transfer Form */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Transfer</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Select Token
                  </label>
                  <select
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                  >
                    <option value="">Select Token</option>
                    <option value={TESTNET_TOKENS.USDT}>USDT</option>
                    <option value={TESTNET_TOKENS.BUSD}>BUSD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    placeholder="0x..."
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    placeholder="0.0"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={handleTransferBNB}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    Send BNB
                  </button>
                  <button
                    onClick={handleTransferToken}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200"
                  >
                    Send Token
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
