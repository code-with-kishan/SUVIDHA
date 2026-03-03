import { useMemo, useState } from 'react';
import OnScreenKeyboard from './OnScreenKeyboard';
import { getOfflineAssistantReply, offlineAssistantQuickPrompts } from '../data/offlineAssistantKnowledge';

const createAssistantMessage = (text) => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role: 'assistant',
  text
});

const createUserMessage = (text) => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role: 'user',
  text
});

export default function OfflineAssistantWidget({ currentPath = '/' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(() => [
    createAssistantMessage(
      'Hello 👧 I am Suvidha. I work offline and can guide you with strict steps for every form. Ask me anything.'
    )
  ]);

  const canSend = useMemo(() => Boolean(input.trim()), [input]);

  const submitQuery = (query) => {
    const clean = String(query || '').trim();
    if (!clean) return;

    const reply = getOfflineAssistantReply({ query: clean, currentPath });
    setMessages((prev) => [...prev, createUserMessage(clean), createAssistantMessage(reply)]);
    setInput('');
  };

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="pointer-events-auto mb-3 w-[22rem] max-w-[92vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between bg-primary px-3 py-2 text-white">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base">👧</div>
              <div>
                <p className="text-sm font-bold">Suvidha</p>
                <p className="text-[11px] text-slate-100">Offline AI Helper</p>
              </div>
            </div>
            <button
              type="button"
              className="touch-btn rounded-md border border-white/30 px-2 py-1 text-xs font-semibold"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto bg-slate-50 p-3">
            {messages.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl px-3 py-2 text-sm ${
                  item.role === 'assistant' ? 'bg-white text-slate-700' : 'bg-secondary text-white'
                }`}
              >
                <p className="whitespace-pre-line">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t bg-white p-3">
            <div className="flex flex-wrap gap-2">
              {offlineAssistantQuickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="touch-btn rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700"
                  onClick={() => submitQuery(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              className="w-full rounded-lg border p-2 text-sm"
              placeholder="Ask your question..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="touch-btn rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                onClick={() => setShowKeyboard((value) => !value)}
              >
                {showKeyboard ? 'Hide Keyboard' : 'Toggle Keyboard'}
              </button>
              <button
                type="button"
                className="touch-btn rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                onClick={() => submitQuery(input)}
                disabled={!canSend}
              >
                Send
              </button>
            </div>

            {showKeyboard && (
              <OnScreenKeyboard
                value={input}
                onChange={setInput}
                maxLength={220}
                language={localStorage.getItem('suvidha_lang') || 'en'}
                mode="text"
                onClose={() => setShowKeyboard(false)}
              />
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        className="pointer-events-auto touch-btn flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-2xl text-white shadow transition hover:-translate-y-0.5"
        onClick={() => setIsOpen((value) => !value)}
        title="Open Suvidha"
      >
        👧
      </button>
    </div>
  );
}
