"use client";
const WEBSOCK_API_URL = process.env.NEXT_PUBLIC_WEBSOCK_SERVER;

export default function WebsockTestPage() {
  const callChangeScreen = async (name: string) => {
    await fetch(`${WEBSOCK_API_URL}/api/change-screen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ screen: name }),
    });
  }

  return (
    <div className="m-3">
      <h1 className="text-2xl font-bold">Websocket screen change test</h1>
      <p className="mb-3">ビュー側で [自サーバーアドレス]/display/test1 にアクセスしてください。 </p>
      <div className="flex flex-row gap-2">
        <button className="p-2 bg-blue-600 cursor-pointer rounded-md hover:bg-blue-700 active:bg-blue-800 transition" onClick={async () => callChangeScreen("test1")}>Go to Test1</button>
        <button className="p-2 bg-blue-600 cursor-pointer rounded-md hover:bg-blue-700 active:bg-blue-800 transition" onClick={async () => callChangeScreen("test2")}>Go to Test2</button>
      </div>
    </div>
  );
}