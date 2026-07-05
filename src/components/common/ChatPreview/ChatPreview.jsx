function ChatPreview() {
  return (
    <section
      id="chat"
      className="py-24 flex flex-col items-center"
    >
      <h2 className="text-4xl font-bold mb-8">
        Chat With Your Documents
      </h2>

      <div className="bg-gray-900 rounded-2xl w-[900px] p-10">

        <div className="space-y-5">

          <div className="bg-blue-600 w-fit px-5 py-3 rounded-xl">
            Summarize this PDF
          </div>

          <div className="bg-gray-700 w-fit px-5 py-3 rounded-xl">
            Sure! Here's a concise summary...
          </div>

        </div>

        <div className="mt-10 flex gap-3">

          <input
            className="flex-1 bg-gray-800 rounded-xl px-5 py-4"
            placeholder="Ask anything..."
          />

          <button className="bg-blue-600 px-8 rounded-xl">
            Send
          </button>

        </div>

      </div>
    </section>
  );
}

export default ChatPreview;