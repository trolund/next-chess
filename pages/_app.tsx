import '../styles/globals.css'
import { Provider } from "mobx-react";
import { fetchInitialStoreState, DataStore } from "../stores/dataStore";
import App, { AppContext } from 'next/app';

interface AppProps {
  Component: any,
  pageProps: any
}

class MyApp extends App<AppProps> {
  state = {
    dataStore: new DataStore()
  };

  // Fetching serialized(JSON) store state
  static async getInitialProps(appContext: AppContext) {
    const appProps = await App.getInitialProps(appContext);
    const initialStoreState = await fetchInitialStoreState();

    return {
      ...appProps,
      initialStoreState
    };
  }

  // Hydrate serialized state to store
  static getDerivedStateFromProps(props: any, state: any) {
    state.dataStore.hydrate(props.initialStoreState);
    return state;
  }

  render() {
    const { Component, pageProps } = this.props;
    return (
      <Provider dataStore={this.state.dataStore}>
        <Component {...pageProps} />
      </Provider>
    );
  }
}
export default MyApp;
