import Web3 from "web3";
import {NotificationContainer, NotificationManager} from 'react-notifications';
import 'react-notifications/lib/notifications.css';

import './App.css';
import { useEffect, useState } from "react";
import contractAbi from "./abi/braindance.json";
import wlUserList from "./wl/user.json";
import publicProof from "./wl/public.json";
import { fromWei, toWei } from "web3-utils";

import goldUserList from "./wl/gold.json";
import silverUserList from "./wl/silver.json";
import { BigNumber } from "ethers/utils";
import medatmaskimg from "./assets/imgs/metamask.svg";

import moment from "moment";

import Modal from "react-modal";

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    borderRadius: 20,
    width: 350,
    height: 200,
    transform: 'translate(-50%, -50%)',
  },
};

Modal.setAppElement('#root');

const contractAddress1 = "0xB566AFc04ED4b65BCC840ab585fa8023a3DB56CE"; // Main Net
const contratAddress2 = "0xB566AFc04ED4b65BCC840ab585fa8023a3DB56CE"; //Main Net
const contratAddress3 = "0xB566AFc04ED4b65BCC840ab585fa8023a3DB56CE"; // Main Net
const sale = true;
const publicSale = false;

function App() {
  var web3;
  var nftContract;
  var address;
  var chainId;
  
  const [maxQuantity] = useState(5);
  const [quantity, setQuantity] = useState(0);
  const [walletAddress, setWalletAddress] = useState('');
  const [legendaryState, setLegendaryState] = useState(0);
  const [leftToken, setLeftToken] = useState(2000);
  const [modalIsOpen, setIsOpen] = useState(true);
  const [countTime, setCountTime] = useState("00:00");

  if(window.ethereum != null) {
  	web3 = new Web3(window.ethereum);
  }

  const connectWallet = async () => {
    if(window.ethereum != null) {
      await window.ethereum.request({method: 'eth_requestAccounts'}).then((data) => {
        address = data[0];
        setWalletAddress(address);
        
        if (modalIsOpen) {
          setIsOpen(false);
        }
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
            let wlUsers = [];;
            // console.log("read--", "$" + walletAddress + "$", silverUserList.indexOf(walletAddress.toString()));
            let groupState = 0;
  
            let whiteuser = false;
            for(var key in goldUserList) {
              if (goldUserList[key].toLowerCase() === walletAddress.toLowerCase()) {
                wlUsers = goldUserList;
                groupState = 1;
                whiteuser = true;
                break;
              }
            }

            for(var key1 in silverUserList) {
              if (silverUserList[key1].toLowerCase() === walletAddress.toLowerCase()) {
                wlUsers = silverUserList;
                groupState = 2;
                whiteuser = true;
                break;
              }
            }

            if (!whiteuser) {
              notificationfunc("error", 'You are not in whitelist.');
              return;  
            }
            // if (goldUserList.indexOf(walletAddress) !== -1) {
            //   wlUsers = goldUserList;
            //   groupState = 1;

            // } else if (silverUserList.indexOf(walletAddress) !== -1) {
            //   wlUsers = silverUserList;
            //   groupState = 2;
            // } else {
            //   notificationfunc("error", 'You are not in whitelist.');
            //   return;
            // }

            let value = 1;
            if (groupState == 1) {
              value = value * 0.06;
            } else if (groupState == 2){
              value = value * 0.09;
            }

            let valuestr = value * quantity;

            const leaves = wlUsers.map(x => keccak256(x));
            const tree = new MerkleTree(leaves, keccak256);
            const root = tree.getRoot().toString('hex');
            // console.log("sssss");
            // console.log(tree.toString());
            const leaf = keccak256(walletAddress);
            
            let userIndex = -1;
            for(var key2 in wlUsers) {
              if (wlUsers[key2].toLowerCase() === walletAddress.toLowerCase()) {
                userIndex = key2;
                break;
              }
            }
            if (userIndex == -1) {
              notificationfunc("error", 'You are not in the whitelist.');
              return;
            }
            // let userIndex = wlUsers.indexOf(walletAddress);


            let hexProof = tree.getHexProof(leaf);

            //Public Sale
            if (publicSale && !hexProof.length) {
              hexProof = publicProof;
              userIndex = 0;
            }
// console.log(walletAddress, chainId);

// console.log(valuestr.toString(), toWei(valuestr.toString(), "ether"));

//             console.log(hexProof, userIndex, groupState);
            if(chainId === '0x1') {
              await web3.eth.getBalance(walletAddress, function(err, result) {
                if (err) {
                  notificationfunc("error", 'Insufficient Funds for Transaction in your Wallet.');
                  return;
                } else {
                  console.log("curreent reulst-", result);
                  if (result + 0.001 < valuestr) {
                    notificationfunc("error", 'Insufficient Funds for Transaction in your Wallet.');
                    return;
                  }

                  const contract = new web3.eth.Contract(nftContract, contractAddress1);
                  if (hexProof.length){
                    contract.methods.mintVip(quantity, hexProof, userIndex, groupState).send({
                      value: toWei(valuestr.toString(), "ether"),
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
                }
              });
              
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
    
    // console.log(walletAddress);

    mintToken();
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

  const checkMerkleTree = () => {
    const { MerkleTree } = require('merkletreejs')
    const keccak256 = require('keccak256');
    const wlUsers = silverUserList;

    const leaves = wlUsers.map(x => keccak256(x));
    const tree = new MerkleTree(leaves, keccak256);
    const root = tree.getRoot().toString('hex');
    console.log("roothash----", root);

    for (var key in silverUserList) {
      var ccAddy = silverUserList[key]
      const leaf = keccak256(ccAddy);
      let userIndex = wlUsers.indexOf(ccAddy);
      let hexProof = tree.getHexProof(leaf);
      console.log(hexProof.length);
    }

  }

  useEffect(() => {
    checkMerkleTree();
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
                let leftTokenNumber = 2000 - result;
                if (leftTokenNumber < 0) leftTokenNumber = 0;
                setLeftToken(leftTokenNumber);
              }
            })
          }
        }
      }, 2000);
    }

    // console.log(new Date("Jan 29 2022 09:00:00 GMT-04").getTime() + 72 * 3600 * 1000);
    // console.log(new Date(moment("Jan 29 2022 09:00:00 GMT-04")).getTime());
    // console.log(new Date('Jan 29 2022 09:00:00 GMT-0400').toString());
    //console.log(moment(new Date()).tz(SETTINGS.system_timezone).format('YYYY-MM-DD HH:mm'));
    // const setCalcTime = () => {
    //   const remaintime = (new Date(moment("Feb 2 2022 19:00:00 GMT-04")).getTime() + 30 * 3600 * 1000 - new Date().getTime())/ 1000;
    //   const timestring = Math.floor(remaintime / 3600) + ":" + Math.floor((remaintime % 3600) / 60);
    //   // console.log(timestring);
    //   setCountTime(timestring);
    // }
    // setCalcTime();
    // setInterval( async () => {
    //   setCalcTime();
    // }, 1000 );

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
          <div className="button-wrapper" >
              <div className="title" >started</div>
              <div className="info" >
                <div className="account-info" >
                  <div className="item" >
                    <label >Token:</label><span >{leftToken}</span>
                  </div>
                </div>
                {/* <div className="contract-info" >
                  <div className="item" >
                    <label >Time Left : </label><span >{countTime}</span>
                  </div>
                </div> */}
              </div>
              
              <input className="quantity-input" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value < 0 || e.target.value > 2 ? 0  : (e.target.value).toString().length > 1 ? (e.target.value).toString()[1] : e.target.value  )} placeholder={0} min="0" max="2"/>
              <div className="mint-wrapper" >
                <button type="button" className="mint" disabled="" onClick={connectAndMint}>Jack In</button>
              </div>
            </div>
        </div>
      </div>

      

      <Modal
        isOpen={modalIsOpen}
        // onAfterOpen={afterOpenModal}
        // onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Example Modal"
      >
        <div className="sc-eCApGN cjAFRf web3modal-provider-wrapper" onClick={connectWallet}>
          <div className="sc-hKFyIo jcNZzC web3modal-provider-container">
            <div className="sc-bdnylx jMhaxE web3modal-provider-icon">
            <img src={medatmaskimg} width={45} alt="Left Arrow"/>
              </div>
            <div className="sc-gtssRu bktcUM web3modal-provider-name">MetaMask</div>
            <div className="sc-dlnjPT eFHlqH web3modal-provider-description">Connect to your MetaMask Wallet</div>
            </div>
        </div>
        </Modal>
      <NotificationContainer/>
    </div>
  );
}

export default App;
