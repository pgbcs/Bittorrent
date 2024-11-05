const http = require('http');

const hostname = '127.0.0.1'; // Server IP address
const port = 3000; // Server port

const trackList=[];


const server = http.createServer((req, res) => {
    //parse param from url
    const parsedUrl = new URL(req.url, `http://${hostname}:${port}`);
    if (req.method === 'GET') {
        const paramsObj = JSON.parse(parsedUrl.searchParams.keys().next().value);
        const {action} = paramsObj;
        if(action =='announce'){
            const {peer_id, IP_address, port, compact} = paramsObj;
            const newPeer ={
                peer_id,
                IP_address,
                port}
            if(!trackList.find(obj => obj.IP_address === newPeer.IP_address)){
                trackList.push(newPeer);
            }
            //return list peer for client
            if(compact===0){//not use compact
                res.end(JSON.stringify(trackList));
            }
            console.log("trackList: ",trackList);
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
