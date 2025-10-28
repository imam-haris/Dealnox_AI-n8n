import { NextResponse } from "next/server";

let clients = [];

export async function GET() {
  return new Response(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const clientId = Date.now();
        let isClosed = false;

        const send = (data) => {
          if (isClosed) return;
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            );
          } catch (err) {
            console.warn(` Cannot send to client ${clientId}: stream closed`);
            isClosed = true;
          }
        };

        const client = { id: clientId, send };
        clients.push(client);
        console.log(` Client connected: ${clientId}`);

        // Initial connected event
        send({ connected: true });

        const interval = setInterval(() => {
          if (isClosed) {
            clearInterval(interval);
            return;
          }
          send({ ping: true });
        }, 20000);

        // When connection closes (browser tab closes or refreshes)
        const closeConnection = () => {
          if (!isClosed) {
            isClosed = true;
            clearInterval(interval);
            clients = clients.filter((c) => c.id !== clientId);
            console.log(`Client disconnected: ${clientId}`);
            try{
                controller.close();
            }catch {}
          }
        };

        //  Correct way — listen for close signal instead of overwriting `.close`
        controller.signal?.addEventListener("abort", closeConnection);
      },

      cancel() {
        console.log(" Stream canceled by client");
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    }
  );
}

export async function POST(req) {
  const body = await req.json();
  console.log("Message from n8n:", body);

  if (!body.message) {
    console.warn("No message received in body");
    return NextResponse.json({ success: false });
  }

  const activeClients = [];
  for (const client of clients) {
    try {
      client.send({
        message:
          typeof body.message === "string"
            ? body.message
            : JSON.stringify(body),
      });
      activeClients.push(client);
    } catch (err) {
      console.warn(`Removing closed client ${client.id}`);
    }
  }

  clients = activeClients;
  console.log(`Sent message to ${activeClients.length} active clients.`);

  return NextResponse.json({ success: true });
}

