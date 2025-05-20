import { Toast } from 'react-native-toast-message/lib/src/Toast';

import { InteractionType } from '@/types/api';
import { Chain } from '@/types/network';
import { SolanaNetwork } from '@/types/store';

const notifyTx = (
  isSuccess: boolean,
  params: {
    chain: Chain;
    type?: InteractionType;
    txId?: string;
    solanaNetwork?: SolanaNetwork;
  }
) => {
  const { chain, type, txId, solanaNetwork } = params;

  if (isSuccess && chain === Chain.Solana && txId && solanaNetwork) {
    Toast.show({
      type: 'txSuccess',
      props: { txId, solanaNetwork },
    });
  } else if (isSuccess) {
    Toast.show({
      type: 'txSuccess',
      props: { type },
    });
  } else {
    Toast.show({
      type: 'txFail',
      props: { chain },
    });
  }
};

const notifySuccess = (message: string) => {
  Toast.show({
    type: 'success',
    text1: 'Success',
    text2: message,
  });
};

const notifyError = (message: string) => {
  Toast.show({
    type: 'error',
    text1: 'An Error Occurred',
    text2: message,
  });
};

const notifyInfo = (message: string) => {
  Toast.show({
    type: 'info',
    text1: 'Info',
    text2: message,
  });
};

const notifyWarning = (message: string) => {
  Toast.show({
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

