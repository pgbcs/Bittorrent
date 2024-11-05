const http = require('http');

const hostname = '127.0.0.1'; // Server IP address
const port = 3000; // Server port

const server = http.createServer((req, res) => {
    //parse param from url
    const parsedUrl = new URL(req.url, `http://${hostname}:${port}`);
    if (req.method === 'GET') {
        const paramsObj = JSON.parse(parsedUrl.searchParams.keys().next().value);
        const {action, connection_id, transaction_id} = paramsObj;

        console.log(action);
        if (action=='connect') {
            console.log(`Received data: Action: ${action}`);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end(JSON.stringify({
                connection_id,
                action,
                transaction_id,
            }));
        }else if(action =='annouce'){
            
        } 
        else{
            res.statusCode = 400; // Bad Request
            res.setHeader('Content-Type', 'text/plain');
            res.end('Missing parameters.\n');
        }
    } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Not Found\n');
    }
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
