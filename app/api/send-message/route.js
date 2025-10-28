export async function POST(req){
    try{
        const message = await req.json();
        const response = await fetch('https://imam-786.app.n8n.cloud/webhook-test/chatbot-webhook', {
            method: 'POST' ,
            headers: {
                'Content-Type' : 'application/json'
            },
            body : JSON.stringify(message)
        });
        const result = await response.json();
        return Response.json({success : true, result});
    }
    catch(error){
        console.error('Error: ' , error);
        return Response.json({success: false , error: error.message}) , {status : 500};
    }
}