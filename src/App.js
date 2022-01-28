import Web3 from "web3";
import {NotificationContainer, NotificationManager} from 'react-notifications';
import 'react-notifications/lib/notifications.css';

import './App.css';
import { useEffect, useState } from "react";
import contractAbi from "./abi/doodle.json";
import wlUserList from "./wl/user.json";
import publicProof from "./wl/public.json";
import Web3Modal from "web3modal";
import WalletConnectProvider from 'web3-providers';
import WalletLink from "walletlink";

const contractAddress1 = "0x0e099d20e5f8fAD56C3BDb18Fe499Bc958248251"; // Main Net
const contratAddress2 = "0x0e099d20e5f8fAD56C3BDb18Fe499Bc958248251"; //Main Net
const contratAddress3 = "0x0e099d20e5f8fAD56C3BDb18Fe499Bc958248251"; // Main Net
const sale = true;
const publicSale = true;

function App() {
  var web3;
  var nftContract;
  var address;
  var chainId;
  const [maxQuantity] = useState(5);
  const [quantity, setQuantity] = useState(0);
  const [walletAddress, setWalletAddress] = useState('');
  const [legendaryState, setLegendaryState] = useState(0);
  const [leftToken, setLeftToken] = useState(2500);
  if(window.ethereum != null) {
  	web3 = new Web3(window.ethereum);
  }

  const connectWallet = async () => {
    if(window.ethereum != null) {
      await window.ethereum.request({method: 'eth_requestAccounts'}).then((data) => {
        address = data[0];
        setWalletAddress(address);
      });
    } else {
      notificationfunc("error", 'Can\'t Find Metamask Wallet. Please install it and reload again to mint NFT.');
    }
  }

  const mintToken = async () => {
    if (!walletAddress){
      notificationfunc("info", 'Please connect Metamask before mint!');
    } else {
      if (quantity <= 0){
        notificationfunc("warning", "Quantity should be more than 0.");
      } else {
        if (quantity > maxQuantity) {
          notificationfunc("error", "Max quantity is " + maxQuantity);
        } else {
          nftContract = contractAbi;
          if (window.ethereum == null) {
            notificationfunc("error", 'Wallet connect error! Please confirm that connect wallet.');
          } else {
            await window.ethereum.request({method: 'eth_chainId'}).then(data => {
              chainId = data;
            });

            const { MerkleTree } = require('merkletreejs')
            const keccak256 = require('keccak256');
            const wlUsers = wlUserList;

            const leaves = wlUsers.map(x => keccak256(x));
            const tree = new MerkleTree(leaves, keccak256);
            const root = tree.getRoot().toString('hex');
            const leaf = keccak256(walletAddress);
            let userIndex = wlUsers.indexOf(walletAddress);
            let hexProof = tree.getHexProof(leaf);

            //Public Sale
            if (publicSale && !hexProof.length) {
              hexProof = publicProof;
              userIndex = 0;
            }
            if(chainId === '0x1') {
              const contract = new web3.eth.Contract(nftContract, contractAddress1);
              if (hexProof.length){
                await contract.methods.mint(walletAddress, quantity, hexProof, userIndex).send({
                  value: 50000000000000000 * quantity,
                  from: walletAddress
                })
                .then(data => {
                  notificationfunc("success", 'Successfully Minted!');
                })
                .catch(err => {
                  notificationfunc("error", err.message);
                })
              } else {
                notificationfunc("warning", "Please check your wallet.");
              }
            }else {
              notificationfunc("info", "Please change the network to Ethereum Mainnet and try again...");
            }
          }
        }
      }
    }
  }

  const connectAndMint = async () => {
    if(!walletAddress)
      await connectWallet();
    
    console.log(walletAddress);

    // mintToken();
  };

  const nextLegendary = (nextNumber) => {
    setLegendaryState(nextNumber);
  }

  const notificationfunc = (type, message) => {
    switch (type) {
      case 'info':
        NotificationManager.info(message);
        break;
      case 'success':
        NotificationManager.success(message);
        break;
      case 'warning':
        NotificationManager.warning(message, 'Warning', 3000);
        break;
      case 'error':
        NotificationManager.error(message, 'Error', 5000);
        break;
      default:
        break;
    }
  }

  const nopresale = () => {
    notificationfunc("info", "Mint presale will be live on Jan 8th");
  }

  useEffect(() => {
    const checkConnection = async () => {
      // Check if browser is running Metamask
      let web3;
      if (window.ethereum) {
          web3 = new Web3(window.ethereum);
      } else if (window.web3) {
          web3 = new Web3(window.web3.currentProvider);
      };
      // Check if User is already connected by retrieving the accounts
      if (web3){
        web3.eth.getAccounts()
        .then(async (addr) => {
            setWalletAddress(addr[0]);
        });
      }
    };
    checkConnection();

    // if (!walletAddress)
    //   await connectWallet();

    if (sale) {
      setInterval( async () => {
        if (web3){
          let contract = new web3.eth.Contract(contractAbi, contractAddress1);
          if (contract){
            await contract.methods.totalSupply().call((err, result) => {
              if (err){
                console.log(err);
              } else {
                let leftTokenNumber = 2500 - result;
                if (leftTokenNumber < 0) leftTokenNumber = 0;
                setLeftToken(leftTokenNumber);
              }
            })
            
          }
        }
      }, 2000);
    }
  }, []);

  return (
    <div className="App">
      <div className="home-page">
        <div className="container_">
          <div className="characters_">
            <div className = "animation-wrapper">
              <iframe title="by" src="./boy/boy.html"></iframe>
            </div>
            <div className = "animation-wrapper">
            <iframe title="by" src="./girl/girl.html"></iframe>
            </div>
          </div>
          <div class="button-wrapper" >
              <div class="title" >Not started</div>
              <div class="info" >
                <div class="account-info" >
                  <div class="item" >
                    <label >Token:</label><span >0</span>
                  </div>
                </div>
                <div class="contract-info" >
                  <div class="item" >
                    <label >Remaining:</label><span >0</span>
                  </div>
                </div>
              </div>
              <div class="mint-wrapper" >
                <button type="button" class="mint" disabled="" onClick={connectAndMint}>Jack In</button>
              </div>
            </div>
        </div>
      </div>
      {/* <Modal
        isOpen={modalIsOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Example Modal"
      >
        <div class="sc-eCApGN cjAFRf web3modal-provider-wrapper">
          <div class="sc-hKFyIo jcNZzC web3modal-provider-container">
            <div class="sc-bdnylx jMhaxE web3modal-provider-icon">
            <img src={medatmaskimg} width={45} alt="Left Arrow"/>
              </div>
            <div class="sc-gtssRu bktcUM web3modal-provider-name">MetaMask</div>
            <div class="sc-dlnjPT eFHlqH web3modal-provider-description">Connect to your MetaMask Wallet</div>
            </div>
        </div>
        </Modal> */}
      <NotificationContainer/>
    </div>
  );
}

export default App;
