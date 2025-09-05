export default function ScoresPage() {
  return (
    <div className="flex flex-col gap-4 bg-gray-100 p-4 rounded">
      <p className="text-lg font-semibold">スコア管理</p>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p>Cool : player 1</p>
          <input placeholder="Score" className="border-b w-full" />
          <label className="block mt-2"><input type="checkbox" defaultChecked /> Put</label>
          <label className="block"><input type="checkbox" /> LostConnect</label>
        </div>
        <div>
          <p>Hot : player 2</p>
          <input placeholder="Score" className="border-b w-full" />
          <label className="block mt-2"><input type="checkbox" /> Put</label>
          <label className="block"><input type="checkbox" /> LostConnect</label>
        </div>
      </div>

      <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">変更</button>
    </div>
  );
}
