// pages/_app.js
import '../styles/globals.css'; // Impor CSS global Anda

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
