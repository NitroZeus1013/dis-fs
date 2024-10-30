const {uuid} = require("uuidv4");
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('node:path');

const BLOCK_SIZE = 100; // bytes
const REPLICATION_FACTOR = 2; //how many replicas
const MINION_CONFIG = {
    "1":{ip:"127.0.0.1",port:8001},
    "2":{ip:"127.0.0.1",port:8002},
    "3":{ip:"127.0.0.1",port:8003},

}


function getNRandomNumbers(list,rf=3){
    const listCopy = [...list];
    const first = listCopy.splice(Math.floor(Math.random()*rf),1)[0];
    const second = listCopy[Math.floor(Math.random()*rf)];
    return [first,second];
}

/*
file_block = {'file.txt': ["block1", "block2"]}
block_minion = {"block1": [1,3]}
minions = {"1": (127.0.0.1,8000), "3": (127.0.0.1,9000)}
*/

/**
 * Master stores 
 * 1) file_block -> file to blocks array
 * 2) block_minion -> blocks to minion id array
 * 3) minions -> minion config
 * 
 * So when you store a file then, chop it into
 */
class Master{
    file_blocks ={};
    block_minion = {};
    minions=MINION_CONFIG;
    block_size = BLOCK_SIZE;
    replication_factor = REPLICATION_FACTOR;

    put_file(fileName,fileSize){
        /* So when you store a file then, chop it into blocks
            give blocks some id, then put those block ids in file_blocks
            2) assign block to one minion(assuming forwading)
        */
       this.file_blocks[fileName] = [];
       const numberOfBlocks = parseInt(Math.ceil(fileSize/this.block_size));
       return this.allocate_blocks(fileName,numberOfBlocks);
    }

    get_file(){

    }

    allocate_blocks(fileName,numberOfBlocks){

        // blockid: [{ip,port},{ip,port}]
        // [{blockId:[{minionIp,port}]}]
        let block_to_minions = [];

        for(let i = 0 ;i<numberOfBlocks;i++){
            let block_id = uuid();
            let minions = getNRandomNumbers(Object.keys(this.minions),this.replication_factor);
            console.log("random minions",minions);
            this.file_blocks[fileName].push(block_id);
            this.block_minion[block_id] = minions;

            block_to_minions.push({block_id,block_addr:minions.map(id=>this.minions[id])});
        }
        return block_to_minions;
    }
}


function main(){
    const protoFilePath = path.join(__dirname,'./proto/master.proto');
    const packageDefinition = protoLoader.loadSync(protoFilePath,{
        longs:Number,
        keepCase: true,
        enums: String,
        defaults: true,
        oneofs: true
    });

    const master = new Master();

    const masterProto = grpc.loadPackageDefinition(packageDefinition).master;

    const server = new grpc.Server();

    server.addService(masterProto.Master.service,{
        put_file:(call,callback)=>{
            const fileName = call.request.fileName;
            const fileSize = call.request.fileSize;
            console.log("Put file call receieved with ",fileName,fileSize);
            const blocks = master.put_file(fileName,fileSize);
            callback(null,{blocks});
        }
    });


    server.bindAsync('127.0.0.1:8000',grpc.ServerCredentials.createInsecure(),(err,port)=>{
        console.log("Master server is listening at ",port);
    })
}

main();