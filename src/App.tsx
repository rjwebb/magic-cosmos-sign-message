import { useCallback, useEffect, useState } from "react";
import { Magic as MagicBase } from "magic-sdk";
import { AuthExtension } from "@magic-ext/auth";
import { CosmosExtension } from "@magic-ext/cosmos";

// this is in a function so that we can use ReturnType
function createMagic(publicMagicApiKey: string, cosmosRpcUrl: string) {
  return new MagicBase(publicMagicApiKey, {
    extensions: [
      new CosmosExtension({
        rpcUrl: cosmosRpcUrl,
      }),
      new AuthExtension(),
    ],
  });
}

type Magic = ReturnType<typeof createMagic>;

function LoginForm({ doConnect }: { doConnect: (email: string) => void }) {
  const [email, setEmail] = useState("");
  return (
    <div>
      <label className="block" htmlFor="bsky-identifier">
        Email address
      </label>
      <input
        type="text"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={() => doConnect(email)}>Connect Wallet</button>
    </div>
  );
}

function SendMessage({ magic }: { magic: Magic }) {
  const [messageText, setMessageText] = useState("");

  const doSign = useCallback(
    async (data: string) => {
      const metadata = await magic.user.getMetadata();

      const jsonTx = [
        {
          typeUrl: "/cosmos.offchain.v1alpha1.MsgSignData",
          value: {
            signer: metadata.publicAddress,
            data,
          },
        },
      ];
      const fee = {
        gas: "0",
        amount: [],
      };
      const res = await magic.cosmos.sign(jsonTx, fee);
      console.log(res);
    },
    [magic.cosmos, magic.user]
  );

  return (
    <div>
      <input
        type="text"
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
      />
      <button onClick={() => doSign(messageText)}>Sign</button>
    </div>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [magic, setMagic] = useState<Magic | null>(null);

  useEffect(() => {
    setMagic(createMagic(import.meta.env.VITE_PUBLIC_MAGIC_API_KEY, ""));
  }, []);

  const connect = useCallback(
    async (email: string) => {
      if (!email) return;
      // connect
      setIsLoading(true);
      const authenticatedAccount = await magic?.auth.loginWithEmailOTP({
        email,
      });
      setIsLoading(false);
      if (authenticatedAccount) {
        console.log(`account: ${authenticatedAccount}`);
        setAccount(authenticatedAccount);
      }
    },
    [magic]
  );

  return magic == null ? (
    <div>Initializing Magic...</div>
  ) : isLoading ? (
    <div>Loading...</div>
  ) : account && magic ? (
    <SendMessage magic={magic} />
  ) : (
    <LoginForm doConnect={connect} />
  );
}

export default App;
