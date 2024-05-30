import { useState, useEffect } from "react";
import { ethers } from "ethers";
import atm_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [transactionHistory, setTransactionHistory] = useState([]);

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const atmABI = atm_abi.abi;

  const getWallet = async () => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }

    if (ethWallet) {
      const accounts = await ethWallet.request({ method: "eth_accounts" });
      handleAccount(accounts);
    }
  };

  const handleAccount = (account) => {
    if (account) {
      console.log("Account connected: ", account);
      setAccount(account);
    } else {
      console.log("No account found");
    }
  };

  const connectAccount = async () => {
    if (!ethWallet) {
      alert("MetaMask wallet is required to connect");
      return;
    }

    const accounts = await ethWallet.request({ method: "eth_requestAccounts" });
    handleAccount(accounts);

    // Once wallet is set, get a reference to the deployed contract
    getATMContract();
  };

  const getATMContract = () => {
    const provider = new ethers.providers.Web3Provider(ethWallet);
    const signer = provider.getSigner();
    const atmContract = new ethers.Contract(contractAddress, atmABI, signer);

    setATM(atmContract);
  };


  const checkBalance = async () => {
    if (atm) {
      try {
        const balance = await atm.getBalance();
        const formattedBalance = ethers.utils.formatEther(balance); // Convert from wei to ETH
        setBalance(formattedBalance); // Update state with the formatted balance (optional for React)
        alert(`Your balance is: ${formattedBalance} ETH`);
      } catch (error) {
        console.error("Error fetching balance:", error);
        alert("Failed to retrieve balance. Please try again later.");
      }
    } else {
      alert("No ATM contract connected. Please connect before checking balance.");
    }
  };
  
  async function getBalance() {
    if (atm) {
      try {
        const balance = await atm.getBalance(); // Assuming atm.getBalance exists
        const formattedBalance = ethers.utils.formatEther(balance);
        // You can use the formattedBalance here (e.g., display it to the user)
        return formattedBalance; // Optionally return the balance
      } catch (error) {
        console.error("Error fetching balance:", error);
        // Handle errors appropriately (e.g., display an error message)
      }
    } else {
      console.error("ATM contract not connected");
      // Handle the case where atm is not connected
    }
  }

  const deposit = async (amount) => {
    if (atm) {
      let tx = await atm.deposit(ethers.utils.parseEther(amount.toString()));
      await tx.wait();
      getBalance();
      updateTransactionHistory("Deposit", amount);
    }
  };

  const withdraw = async (amount) => {
    if (atm) {
      let tx = await atm.withdraw(ethers.utils.parseEther(amount.toString()));
      await tx.wait();
      getBalance();
      updateTransactionHistory("Withdraw", -amount);
    }
  };

  const viewAccountInfo = async () => {
    if (atm) {
      try {
        const signerAddress = await atm.signer.getAddress();
        alert(`Your Ethereum Address: ${signerAddress}`);
      } catch (error) {
        console.error("Error fetching account info:", error);
        alert("Failed to retrieve account information. Please try again later.");
      }
    }
  };

  const disconnectWallet = async () => {
    if (ethWallet) {
      try {
        // Assuming you're using MetaMask, this approach should work
        await ethWallet.request({ method: "eth_requestAccounts", params: [] }); // Request accounts with an empty array to disconnect
        setEthWallet(undefined);
        setAccount(undefined);
        setBalance(undefined);
        setTransactionHistory([]); // Clear transaction history
        alert("Disconnected from wallet successfully!");
      } catch (error) {
        console.error("Error disconnecting wallet:", error);
        alert("Failed to disconnect wallet. Please try again later.");
      }
    } else {
      alert("No wallet connected to disconnect.");
    }
  };
  

  const updateTransactionHistory = (action, amount) => {
    const newTransaction = { action, amount, timestamp: Date.now() };
    setTransactionHistory([...transactionHistory, newTransaction]);
  };

  const renderTransactionHistory = () => {
    return (
      <div>
        <h3>History of Transaction</h3>
        <ul>
          {transactionHistory.map((transaction, index) => (
            <li key={index}>
              {transaction.action} {Math.abs(transaction.amount)} ETH -{" "}
              {new Date(transaction.timestamp).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const initUser = () => {
    // Check if user has MetaMask
    if (!ethWallet) {
      return <p>Please install MetaMask to use this ATM.</p>;
    }

    // Check if user is connected. If not, connect to their account
    if (!account) {
      return (
        <button onClick={connectAccount}>Kindly link your Metamask wallet.</button>
      );
    }

    if (checkBalance === undefined) {
      getBalance();
    }

    return (
      <div>
        <button onClick={viewAccountInfo}>View Account Info</button>
        <button onClick={checkBalance}>Refresh Balance</button> 
        <button onClick={disconnectWallet}>Disconnect Wallet</button>
        <p> </p>
        <input type="number" id="depositAmount" placeholder="Amount to Deposit" />
        <button onClick={() => deposit(document.getElementById("depositAmount").value)}>Deposit</button>
        <input type="number" id="withdrawAmount" placeholder="Amount to Withdraw" />
        <button onClick={() => withdraw(document.getElementById("withdrawAmount").value)}>Withdraw</button>
        {renderTransactionHistory()}
      </div>
    );
  };

  useEffect(() => {
    getWallet();
  }, []);

  return (
    <main className="container">
      <header>
        <h1>WELCOME TO THE METACRAFTERS!!</h1>
      </header>
      {initUser()}
      <style jsx>{`
        .container {
          text-align: center;
          margin-top: 120px;
          color: #FE83AA;
          background-color: #F9DCDC;
          padding: 50px;
          border-radius: 40px;
        }
        button {
          margin: 30px;
          padding: 10px 20px;
          background-color: #FE83AA;
          color: #fff;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 20px;
        }
        button:hover {
          background-color: #FE83AA;
        }
        input {
          margin: 5px;
          padding: 5px;
        }
        ul {
          list-style: none;
          padding: 0;
        }
        li {
          margin-bottom: 5px;
        }
      `}</style>
    </main>
  );
}
