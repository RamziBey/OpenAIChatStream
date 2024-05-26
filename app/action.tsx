'use server';
 
import { experimental_StreamingReactResponse, Message } from 'ai';

interface RequestDataForAI {
    messages: Message[],
    model: string,
}

interface AIMessage {
    role: string,
    content: string
}

const prompt: AIMessage = {
    role: "system",
    content: `You are a customer assistant and you try to suggest the best phone depending on your customer needs (price, battery, photo, operating system....). Here are your sources:
      - https://www.theverge.com/23879726/apple-iphone-15-plus-review
      - https://www.theverge.com/23879726/apple-iphone-15-plus-review
      - https://www.theverge.com/23352282/iphone-14-review-apple
      - https://www.theverge.com/24058916/samsung-galaxy-s24-plus-review-screen-battery-camera
      - https://www.theverge.com/24053907/samsung-galaxy-s24-ultra-review-ai-screen-camera-battery
      - https://www.theverge.com/24051466/honor-magic-v2-review
      - https://www.theverge.com/24047368/oneplus-12-review
      - https://www.theverge.com/23912370/google-pixel-8-pro-review-camera-assistant-magic-editor-best-take-audio-eraser
      - https://www.theverge.com/23826325/samsung-galaxy-z-fold-5-review-screen-hinge-battery-camera
      
      Try to note exceed 1000 characters on your replies
      If the customer asks you something about another topics than phones, reply that it's not your field and you can't help him`
}

function parse(decodedChunk: string) {
    const lines = decodedChunk.split('\n');
    const trimmedData = lines.map(line => line.replace(/^data: /, "").trim());
    const filteredData = trimmedData.filter(line => !["", "[DONE]"].includes(line));
    const parsedData = filteredData.map(line => JSON.parse(line));
    
    return parsedData;
}

async function callToOpenAi(request: RequestDataForAI) {
    const messages = [prompt]

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        cache: 'no-cache',
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_KEY}`
        },
        body: JSON.stringify({
            model: request.model,
            messages: messages.concat(request.messages),
            stream: true,
        }),
    });
    if (response.body != null) {
        let reader = response.body.getReader();
        return streamReader(reader);
    }
}

function streamReader(reader: ReadableStreamDefaultReader<Uint8Array>) {
    const textDecoder = new TextDecoder();
    let buffer = '';

    return (new ReadableStream({
        start(controller) {
            function push() {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        controller.close();
                        return;
                    }
                    const decodedChunk = textDecoder.decode(value);
                    buffer += decodedChunk;
                    const encoder = new TextEncoder();

                    try {
                        const cleaneddata = parse(buffer)
                        for (let line of cleaneddata) {
                            const { content } = line.choices[0].delta;
                            
                            if (content) {
                                const bufferEncoded = encoder.encode(content);
                                controller.enqueue(bufferEncoded);
                                buffer = ''
                            }
                        }
                    } catch {
                        push()
                        return
                    }
                    push();
                });
            }
            push()
        },
    }))
}
 
export async function handler({ messages }: { messages: Message[] }) {
    let request: RequestDataForAI = {messages: [], model: "gpt-4-1106-preview"}
    request.messages = messages
    const response = await callToOpenAi(request)
    if (response != null) {
        return new experimental_StreamingReactResponse(response, {
            ui({ content }) {
            return (
                <div className="p-4 bg-gray-100 text-slate-900 ml-2 rounded-md w-fit break-words">
                    {content}
                </div>
            );
            },
        });
    }
}