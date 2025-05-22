import { Toast } from 'react-native-toast-message/lib/src/Toast';
import * as WebBrowser from "expo-web-browser";

import { InteractionType } from '@/types/api';
import { Chain } from '@/types/network';
import { getExplorerUrl } from '@/utils/explorerUrl';

const Offset = 60;

const notifyTx = (
  isSuccess: boolean,
  params: {
    chain: Chain;
    type?: InteractionType;
    txId?: string;
    network?: string;
  }
) => {
  const { chain, type, txId, network } = params;
  console.log("Notifying tx: ", params);

  if (isSuccess && txId && network) {
    const url = getExplorerUrl(chain, txId, network);
    console.log("Explorer URL: ", url);
    Toast.show({
      topOffset: Offset,
      type: 'txSuccess',
      props: { chain, type, txId, network, onPress: () => WebBrowser.openBrowserAsync(url) },
    });
  } else {
    Toast.show({
      topOffset: Offset,
      type: 'txFail',
      props: { chain },
    });
  }
};

const notifySuccess = (message: string) => {
  Toast.show({
    topOffset: Offset,
    type: 'success',
    text1: 'Success',
    text2: message,
  });
};

const notifyError = (message: string) => {
  Toast.show({
    topOffset: Offset,
    type: 'error',
    text1: 'An Error Occurred',
    text2: message,
  });
};

const notifyInfo = (message: string) => {
  Toast.show({
    topOffset: Offset,
    type: 'info',
    text1: 'Info',
    text2: message,
  });
};

const notifyWarning = (message: string) => {
  Toast.show({
    topOffset: Offset,
    type: 'warning',
    text1: 'Warning',
    text2: message,
  });
};

const notifyLoading = (message: string) => {
  Toast.show({
    type: 'loading',
    text1: 'Loading',
    text2: message,
  });
};
export { notifyError, notifyInfo, notifySuccess, notifyTx, notifyWarning, notifyLoading };

