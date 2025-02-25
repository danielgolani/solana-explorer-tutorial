import { useState, useEffect } from "react";
import {
  Connection,
  PublicKey,
  Transaction,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { Button, Text, Heading, VStack } from "@chakra-ui/react";

type DisplayEncoding = "utf8" | "hex";
type PhantomEvent = "disconnect" | "connect";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions"
  | "signMessage";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (
    message: Uint8Array | string,
    display?: DisplayEncoding
  ) => Promise<any>;
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: any) => void) => void;
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}

const getProvider = (): PhantomProvider | undefined => {
  if ("solana" in window) {
    const anyWindow: any = window;
    const provider = anyWindow.solana;
    if (provider.isPhantom) {
      return provider;
    }
  }
  window.open("https://phantom.app/", "_blank");
};

const NETWORK = clusterApiUrl("mainnet-beta");

export default function BalanceCard() {
  const provider = getProvider();
  const connection = new Connection(NETWORK);

  const [balance, setBalance] = useState<number>();
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (log: string) => setLogs([...logs, log]);
  useEffect(() => {
    if (provider) {
      return () => {
        provider.disconnect();
      };
    }
  }, [provider]);
  if (!provider) {
    return <h2>Could not find a provider</h2>;
  }

  const connect = async () => {
    try {
      const res = await provider.connect();
      addLog(JSON.stringify(res));
      // const publicKey = new PublicKey(res.publicKey);
      connection.getBalance(res.publicKey).then((balance) => {
        setBalance(balance / LAMPORTS_PER_SOL);
      });
    } catch (err) {
      console.warn(err);
      addLog("Error: " + JSON.stringify(err));
    }
  };

  const disconnect = async () => {
    try {
      const res = await provider.disconnect();
      addLog(JSON.stringify(res));
    } catch (err) {
      console.warn(err);
      addLog("Error: " + JSON.stringify(err));
    }
  };

  return (
    <VStack w="100%" align="start" background="white" rounded="lg" p="4">
      <Text>Currently, this is a test to connect to your Mainnet wallet and return your Solana balance. As this code matures, it will be able to detect which monke babies you have in your wallet, and do some fun stuff with them! Try it out :)</Text>
      
      {provider && provider.publicKey ? (
        <>
          <Heading size="md">Your Address:</Heading>
          <Text>{provider.publicKey?.toBase58()}</Text>
          <Text>Current sol balance: {balance}</Text>

          <Button onClick={disconnect}>Disconnect</Button>
        </>
      ) : (
        <>
          <Button onClick={connect}>Connect to Phantom</Button>
        </>
      )}
    </VStack>
  );
}
