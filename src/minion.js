const path = require('node:path');
const fs = require('node:fs');



class Minion{
    dataDir='';
    port = undefined;
    constructor(dd,port){
        this.dataDir = dd;
        this.port = port;
    }

    min_put(blockId, data,minions){
        const blockPath = path.join(this.dataDir,blockId);
        fs.writeFileSync(blockPath,data,{mode:'w'});
        if(minions.length > 0){
            this.forward_put(data,minions);
        }
    }

    forward_put(data,minions){
        let next_minion = minions[0]; 
        minions = minions.slice(1);
        let {ip,port}= next_minion;
        // conect to this ip and port and call put
    }
}


function main(){
    const dataDir = '/tmp/min1';
    const port = 8001;

    if(!fs.existsSync(dataDir)){
        fs.mkdirSync(dataDir);
    }

    console.log("Starting minion on port",port);
    const min = new Minion(dataDir,port);
    // run rpc server here
}