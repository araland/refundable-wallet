import { HashRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";

import { MetaMaskProvider } from "@metamask/sdk-react";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <MetaMaskProvider
    debug={false}
    sdkOptions={{
      logging: {
        developerMode: true,
      },
      communicationServerUrl: process.env.REACT_APP_COMM_SERVER_URL,
      checkInstallationImmediately: false, // This will automatically connect to MetaMask on page load
      dappMetadata: {
        name: "Electron Metamask Connect",
        url: window.location.host,
      },
    }}
  >
    <HashRouter>
      <App />
    </HashRouter>
  </MetaMaskProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
