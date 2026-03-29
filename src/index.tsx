import ReactDOM from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider, msalInstance } from "./components/pipeline/deal/activities/email/authProvider";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

if (process.env.NODE_ENV !== "development") {
  console.log = () => {};
}

// Detect if this page loaded inside a popup (MSAL login redirect)
const isInPopup = window.opener && window.opener !== window;

if (isInPopup) {
  // We're inside the MSAL login popup — just handle the redirect and close
  msalInstance.handleRedirectPromise().then(() => {
    window.close();
  }).catch(() => {
    window.close();
  });
} else {
  // Normal app load
  root.render(
    <AuthProvider>
      <BrowserRouter basename={window.config.HomePage}>
        <App />
      </BrowserRouter>
    </AuthProvider>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
