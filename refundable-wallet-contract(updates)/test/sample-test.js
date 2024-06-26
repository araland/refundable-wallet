const { utils } = require("ethers");
const { ethers } = require("hardhat");

let owner;
let user;
let anotherUser;

describe("The MSG Token Faucet Contract", function () {
  it("Deploy MSG Token Contract", async function () {
    [owner, user, anotherUser] = await ethers.getSigners();

    const MSGToken = await ethers.getContractFactory("ARMY");
    let msgToken = await MSGToken.deploy();
    await msgToken.deployed();
    console.log("MSG token address: ", msgToken.address);

    console.log("\n------- Faucet Test -------\n");
    let faucetTx = await msgToken.faucet(user.address);
    await faucetTx.wait();
    console.log(faucetTx.hash);
    faucetTx = await msgToken.faucet(anotherUser.address);
    await faucetTx.wait();
    console.log(faucetTx.hash);

    console.log(
      "\n---- user token contract: ",
      await msgToken.balanceOf(user.address)
    );
    console.log(
      "\n---- another user token contract: ",
      await msgToken.balanceOf(anotherUser.address)
    );
  });
});
