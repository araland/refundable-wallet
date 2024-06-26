import { useState, useEffect } from "react";
import { useSDK } from "@metamask/sdk-react";

import Web3 from "web3";
import ERC20ABI from "../../utils/abi/ERC20.json";
import WalletABI from "../../utils/abi/RefundableWallet.json";

import { getEllipsisTxt, n4 } from "../../utils/formatter";
import Spinner from "./Spinner";

interface PopularTokenList {
  usdt: number;
  usdc: number;
  busd: number;
  poolBusd: number;
}

const refundableWalletAddress = "0x12A1c6D6922338CA6A0A1B6ffE6D0b966DE5B7fb";
const tBusdTokenAddress = "0x60dca806DE7B451851294b06Bea57584277bE949";

const ethRpc = "https://public.stackup.sh/api/v1/node/bsc-testnet"; // bsc testnet rpc
const erc20Token: any = {
  1: {
    usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    usdc: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    busd: "0x4fabb145d64652a948d72533023f6e7a623c7c53",
  },
  56: {
    usdt: "0x55d398326f99059ff775485246999027b3197955",
    usdc: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
    busd: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
  },
  97: {
    usdt: "0x3b381528099ecb2be76b89fa49d4776b3357fec8",
    usdc: "0xE6C70f9D9713523a0F271F0d43E246b6C05b886A",
    busd: "0x60dca806DE7B451851294b06Bea57584277bE949",
  },
};

function Home() {
  const { sdk, connected, connecting, provider, chainId, account } = useSDK();
  const web3 = new Web3(provider || ethRpc);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [ethBalance, setEthBalance] = useState<number>(0);
  const [poolEthBalance, setPoolEthBalance] = useState<number>(0);
  const [popularErcToken, setPopularErcToken] = useState<PopularTokenList>({
    usdt: 0,
    usdc: 0,
    busd: 0,
    poolBusd: 0,
  });
  const [value, setValue] = useState<string>("0");
  const [tokenRate, setTokenRate] = useState<number>(0);
  const [initEthDepositAmount, setInitEthDepositAmount] = useState<number>(0);
  const [dispersableEthAmount, setDispersableEthAmount] = useState<number>(0);
  const [refundableAmount, setRefundableAmount] = useState<number>(0);

  const connect = async () => {
    try {
      await sdk?.connect();
    } catch (err) {
      console.warn(`failed to connect..`, err);
    }
  };
  const disconnect = async () => {
    try {
      sdk?.disconnect();
    } catch (err) {
      console.error("failed to disconnect..", err);
    }
  };

  const getEthBalance = async (targetAddr: string) => {
    if (!targetAddr) {
      setIsLoading(false);
      return 0;
    }

    try {
      const getBalance = await web3.eth.getBalance(targetAddr);
      const ethBalance = Number(web3.utils.fromWei(getBalance, "ether"));

      return ethBalance;
    } catch (err) {
      console.error("Error on getEthBalance: ", err);
      setIsLoading(false);
      return 0;
    }
  };
  const getErcBalance = async (
    targetAddr: string,
    token: string,
    chainId: number
  ) => {
    if (!chainId) {
      setIsLoading(false);
      return 0;
    }

    try {
      const tokenAddress = erc20Token[chainId][token];
      const contract: any = new web3.eth.Contract(ERC20ABI, tokenAddress);
      const bal = await contract.methods.balanceOf(targetAddr).call();

      return bal;
    } catch (err) {
      console.error("Error on getErcBalance: ", err);
      setIsLoading(false);
      return 0;
    }
  };

  const getTokenRate = async () => {
    // get token rate from the refundable contract
    try {
      const contract: any = new web3.eth.Contract(
        WalletABI.abi,
        refundableWalletAddress
      );
      const rate = await contract.methods.tokenRate().call();

      return rate;
    } catch (err) {
      console.error("Error on getErcBalance: ", err);
      setIsLoading(false);
      return 0;
    }
  };
  const getInitEthDepositAmount = async () => {
    // get initial deposit eth amount from the refundable contract
    try {
      const contract: any = new web3.eth.Contract(
        WalletABI.abi,
        refundableWalletAddress
      );
      const initEthDeposit = await contract.methods.deposit().call();

      return initEthDeposit;
    } catch (err) {
      console.error("Error on getInitEthDepositAmount: ", err);
      return 0;
    }
  };
  const getDispersableEthBalance = async () => {
    // get dispersable eth balance from the refundable contract
    try {
      const contract: any = new web3.eth.Contract(
        WalletABI.abi,
        refundableWalletAddress
      );
      const dispersableEth = await contract.methods
        .getDispersableEther()
        .call();

      return dispersableEth;
    } catch (err) {
      console.error("Error on getDispersableEthBalance: ", err);
      setIsLoading(false);
      return 0;
    }
  };
  const getRefundableEthBalance = async () => {
    // get refundable eth balance from the refundable contract
    try {
      const contract: any = new web3.eth.Contract(
        WalletABI.abi,
        refundableWalletAddress
      );
      const refundableEth = await contract.methods
        .getRefundableBalance()
        .call();

      return refundableEth;
    } catch (err) {
      console.error("Error on getRefundableEthBalance: ", err);
      setIsLoading(false);
      return 0;
    }
  };

  const onValueChange = async (evt: any) => {
    setValue(evt.target.value);
    // calculate buy or refund amount
  };

  // buy function for user
  const buyToken = async () => {
    if (!account || actionLoading || !value || Number(value) === 0) {
      return;
    }

    try {
      setActionLoading(true);
      // buy token using eth value from the refundable contract buy payable function
      const contract: any = new web3.eth.Contract(
        WalletABI.abi,
        refundableWalletAddress
      );
      const buy = await contract.methods.buy().send({
        from: account,
        value: web3.utils.toWei(value.toString(), "ether"),
      });
      console.log("buy transaction: ", buy);
      setValue("0");
      setActionLoading(false);
    } catch (err) {
      console.error("Error on buyToken: ", err);
      setActionLoading(false);
    }
  };

  // refund function for user
  const refundEth = async () => {
    if (!account || actionLoading || !value || Number(value) === 0) {
      return;
    }

    try {
      setActionLoading(true);
      // refund eth value from the refundable contract refund payable function
      const contract: any = new web3.eth.Contract(
        WalletABI.abi,
        refundableWalletAddress
      );
      const tokenValue = web3.utils.toWei(value.toString(), "ether");
      // approve token
      const tBusdContract: any = new web3.eth.Contract(
        ERC20ABI,
        tBusdTokenAddress
      );
      const approve = await tBusdContract.methods
        .approve(refundableWalletAddress, tokenValue)
        .send({ from: account });
      console.log("approve hash: ", approve.hash);

      const refund = await contract.methods
        .refund(tokenValue)
        .send({ from: account });
      console.log("refund hash: ", refund.hash);
      setValue("0");
      setActionLoading(false);
    } catch (err) {
      console.error("Error on refundEth: ", err);
      setActionLoading(false);
    }
  };

  // pull eth function for admin
  const pullEth = async () => {
    if (!account || actionLoading || !value || Number(value) === 0) {
      return;
    }

    try {
      setActionLoading(true);
      // pull eth value from the refundable contract pull function with value parameter of bnb
      const contract: any = new web3.eth.Contract(
        WalletABI.abi,
        refundableWalletAddress
      );
      const pull = await contract.methods
        .pullEther(web3.utils.toWei(value.toString(), "ether"))
        .send({ from: account });
      console.log("pull hash: ", pull.hash);
      setValue("0");
      setActionLoading(false);
    } catch (err) {
      console.error("Error on pullEth: ", err);
      setActionLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      if (account) {
        const ethVal = await getEthBalance(account);
        setEthBalance(ethVal);

        const usdtRes = await getErcBalance(account, "usdt", Number(chainId));
        setPopularErcToken((prevState) => ({
          ...prevState,
          usdt: Number(usdtRes) / 10 ** 6,
        }));

        const usdcRes = await getErcBalance(account, "usdc", Number(chainId));
        setPopularErcToken((prevState) => ({
          ...prevState,
          usdc: Number(usdcRes) / 10 ** 18,
        }));

        const busdRes = await getErcBalance(account, "busd", Number(chainId));
        setPopularErcToken((prevState) => ({
          ...prevState,
          busd: Number(busdRes) / 10 ** 18,
        }));

        const poolBusdRes = await getErcBalance(
          refundableWalletAddress,
          "busd",
          Number(chainId)
        );
        setPopularErcToken((prevState) => ({
          ...prevState,
          poolBusd: Number(poolBusdRes) / 10 ** 18,
        }));
      }
      if (refundableWalletAddress) {
        const poolEthVal = await getEthBalance(refundableWalletAddress);
        setPoolEthBalance(poolEthVal);
      }

      // get token rate
      const rateRes = await getTokenRate();
      setTokenRate(Number(rateRes) / 10 ** 18);

      // get initial deposit eth amount
      const initEthRes = await getInitEthDepositAmount();
      setInitEthDepositAmount(Number(initEthRes) / 10 ** 18);

      // get dispersable eth amount
      const dispersableRes = await getDispersableEthBalance();
      setDispersableEthAmount(Number(dispersableRes) / 10 ** 18);

      // get refundable balance
      const refundableRes = await getRefundableEthBalance();
      setRefundableAmount(Number(refundableRes) / 10 ** 18);

      setIsLoading(false);
    }

    init();

    return () => {
      setEthBalance(0);
      setPoolEthBalance(0);
      setPopularErcToken({
        usdt: 0,
        usdc: 0,
        busd: 0,
        poolBusd: 0,
      });
      setIsLoading(false);
    };
  }, [account, chainId]);

  return (
    <div className="home bg-cover-pattern min-h-screen">
      <div className="container m-auto p-4">
        <div className="heading h-20 flex justify-end items-center">
          {connected ? (
            <div
              className="disconnect-btn wallet-btn border-2 border-white rounded p-2 cursor-pointer"
              onClick={disconnect}
            >
              {account ? getEllipsisTxt(account) : "Connecting..."}
            </div>
          ) : (
            <div
              className="connect-btn wallet-btn border-2 border-white rounded p-2 cursor-pointer"
              onClick={connect}
            >
              {connecting ? "Connecting..." : "Connect"}
            </div>
          )}
        </div>

        <div className="sub-information">
          <div className="status">
            <span className="key-label text-lg">Connection Status: </span>
            <span className="value-label">
              {connected ? "connected" : "disconnected"}
            </span>
          </div>
          <div className="chain-id">
            <span className="key-label text-lg">Chain ID: </span>
            <span className="value-label">
              {chainId ? Number(chainId) : "disconnected"}
            </span>
          </div>
        </div>

        <div className="content h-full py-20 flex gap-8">
          <div className="connect-box wallet-info w-1/2 border border-white p-4 rounded-md">
            <h2 className="heading text-center pb-3 text-lg font-bold">
              Wallet Information
            </h2>

            <div className="wallet-balance flex items-center gap-2 mt-4">
              <span className="key-label text-lg">ETH Value: </span>
              <span className="value-label">
                {isLoading ? <Spinner /> : n4.format(ethBalance)}
              </span>
            </div>
            <div className="wallet-balance flex items-center gap-2">
              <span className="key-label text-lg">USDT Value: </span>
              <span className="value-label">
                {isLoading ? <Spinner /> : n4.format(popularErcToken.usdt)}
              </span>
            </div>
            <div className="wallet-balance flex items-center gap-2">
              <span className="key-label text-lg">USDC Value: </span>
              <span className="value-label">
                {isLoading ? <Spinner /> : n4.format(popularErcToken.usdc)}
              </span>
            </div>
            <div className="wallet-balance flex items-center gap-2">
              <span className="key-label text-lg">BUSD Value: </span>
              <span className="value-label">
                {isLoading ? <Spinner /> : n4.format(popularErcToken.busd)}
              </span>
            </div>
          </div>

          <div className="pool-info w-1/2 border border-white p-4 rounded-md">
            <h2 className="heading text-center pb-3 text-lg font-bold">
              Pool Information
            </h2>

            <div className="wallet-balance flex items-center gap-2 mt-4">
              <span className="key-label text-lg">ETH Value: </span>
              <span className="value-label">
                {isLoading ? <Spinner /> : n4.format(poolEthBalance)}
              </span>
            </div>
            <div className="wallet-balance flex items-center gap-2">
              <span className="key-label text-lg">BUSD Value: </span>
              <span className="value-label">
                {isLoading ? <Spinner /> : n4.format(popularErcToken.poolBusd)}
              </span>
            </div>
            <div className="wallet-balance flex items-center gap-2">
              <span className="key-label text-lg">Token Rate: </span>
              <span className="value-label">
                {isLoading ? <Spinner /> : n4.format(tokenRate)}
              </span>
            </div>
            <div className="wallet-balance flex items-center gap-2">
              <span className="key-label text-lg font-medium">
                Initial ETH Value:{" "}
              </span>
              <span className="value-label">
                {isLoading ? <Spinner /> : n4.format(initEthDepositAmount)}
              </span>
            </div>
            <div className="wallet-balance flex items-center gap-2">
              <span className="key-label text-lg font-medium">
                Dispersable ETH Value:{" "}
              </span>
              <span className="value-label">
                {isLoading ? <Spinner /> : n4.format(dispersableEthAmount)}
              </span>
            </div>
            <div className="wallet-balance flex items-center gap-2">
              <span className="key-label text-lg font-medium">
                Refundable ETH Value:{" "}
              </span>
              <span className="value-label">
                {isLoading ? <Spinner /> : n4.format(refundableAmount)}
              </span>
            </div>
          </div>
        </div>

        <div className="footer text-center pb-10">
          <input
            type="text"
            aria-label="disabled input"
            className="mb-6 bg-gray-100 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none m-auto w-64"
            value={value}
            onChange={(e) => onValueChange(e)}
          />
          <div>
            <button
              type="button"
              className="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2"
              onClick={() => buyToken()}
            >
              {actionLoading ? "Loading..." : "Buy"}
            </button>
            <button
              type="button"
              className="focus:outline-none text-white bg-yellow-400 hover:bg-yellow-500 focus:ring-4 focus:ring-yellow-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 "
              onClick={() => refundEth()}
            >
              {actionLoading ? "Loading..." : "Refund"}
            </button>
            <button
              type="button"
              className="focus:outline-none text-white bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:ring-purple-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 "
              onClick={() => pullEth()}
            >
              {actionLoading ? "Loading..." : "Pull ETH (Admin)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
