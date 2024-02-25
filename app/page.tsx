'use client'

import { useState, useEffect } from "react"
import { useChat } from "ai/react";
import { handler } from "./action";
import ChatTypingAnimation from "./components/ChatTypingAnimation/ChatTypingAnimation";

export const runtime = 'edge';

export default function Home() {
  const [conversation, setConversation] = useState<Array<string>>([]);
  const [openAiLoading, setOpenAiLoading] = useState<boolean>(false);
  const [streamResponse, setStreamResponse] = useState("");

  const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat({
    api: handler as any,
    onError: (e) => {
        console.error(e);
    },
    onFinish: () => {
      setOpenAiLoading(false)
    } 
  });

  const classnames = ["text-right flex justify-end mt-2", "flex mt-2"]
  const textClassNames = [
    "p-4 bg-emerald-300 w-fit text-right text-slate-900 rounded-md break-words max-w-xs	",
    "p-4 bg-rose-300 text-slate-900 rounded-md w-fit break-words max-w-xs	"
  ]

  useEffect(() => {
    observeMessage()
  }, [messages]);

  function submitData(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const messageInput = (document.getElementById('user-input') as HTMLTextAreaElement).value;
    (document.getElementById('user-input') as HTMLTextAreaElement).value = "";
    setOpenAiLoading(true)

    setConversation(prevConversation => [...prevConversation, messageInput]);
    handleSubmit(e);
  }

  function handleDeleteAction() {
    setConversation([])
    setMessages([])
  }

  function observeMessage() {
    if (openAiLoading) {
        if (messages.length % 2 == 0 && conversation.length % 2 != 0) {
            conversation.push('')
        } else {
            if (messages.length % 2 == 0)
                if (messages[messages.length - 1].content != streamResponse) {
                    conversation[conversation.length - 1] = messages[messages.length - 1].content
                    setStreamResponse(messages[messages.length - 1].content)
                }
        }
        return true
    }
    return false
}

  return (
    <div id="global-container" className="w-1/2 flex justify-center h-full flex-col m-auto py-4 gap-4">
      <div id="chat" className="h-full bg-slate-100 p-4 rounded-sm overflow-scroll">
        {
          conversation.map((elem, index) => {
            return (
              <div key={index} className={classnames[index % classnames.length]}>
                <p className={textClassNames[index % textClassNames.length]}>{elem}</p>
              </div>
            )
          })
        }
      </div>

      <div id="input" className="w-full h-fit">
        <form name="questionForm" onSubmit={(e) => {
          submitData(e)
        }}>
          <div>
            <input type="text" className="w-full text-slate-900 bg-slate-100 p-2" name="user input" id="user-input" placeholder="Type your text here" onChange={handleInputChange}/>
            <div className="grid grid-cols-2 gap-2 mt-2">
              { openAiLoading && <button className='w-full bg-emerald-800 rounded-sm'><ChatTypingAnimation /></button>}
              { !openAiLoading && <button className="w-full bg-emerald-800 rounded-sm">Send</button>}
              <button className="w-full bg-rose-800 rounded-sm" type="button" onClick={handleDeleteAction}>Clear</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
