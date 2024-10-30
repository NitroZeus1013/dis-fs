const path = require('node:path');
const fs = require('node:fs');

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');


function connectToGrpcMinionServer(protoFilePath,host,port){
    const protoFilePathFull = path.join(__dirname,protoFilePath);
    const packageDefinition = protoLoader.loadSync(protoFilePathFull,{
        longs:Number,
        keepCase: true,
        enums: String,
        defaults: true,
        oneofs: true
    })

    const masterProto = grpc.loadPackageDefinition(packageDefinition).minion;

    const client = new masterProto.Minion(`${host}:${port}`,grpc.credentials.createInsecure());

    return client;

}

class Minion{
    dataDir='';
    port = undefined;
    constructor(dd,port){
        this.dataDir = dd;
        this.port = port;
    }

    min_put(blockId, data,minions){
        console.log("writing block ",blockId);
        const blockPath = path.join(this.dataDir,blockId);
        fs.writeFileSync(blockPath,data,{flag:'w'});
        if(minions.length > 0){
            this.forward_put(blockId,data,minions);
        }
    }

    forward_put(blockId,data,minions){
        let next_minion = minions[0]; 
        minions = minions.slice(1);
        let {ip,port}= next_minion;
        const client = connectToGrpcMinionServer('./proto/minion.proto',ip,port);
        client.put({blockId,data,minions},(error,resp)=>{
            if(error){
                console.log("error is ",error);
                return;
            }
            console.log("Block forwarded to ", ip, port);
        });
    }
}


function main(){
    let dataDir = '/tmp/min1';
    let port = 8001;

    const argv1 = process.argv.slice(2);
    port = parseInt(argv1[0]);
    dataDir = argv1[1];
    console.log("port ",port," \ndataDir ", dataDir);
    if(!fs.existsSync(dataDir)){
        fs.mkdirSync(dataDir);
    }

    console.log("Starting minion on port",port);

    const min = new Minion(dataDir,port);

    const protoFilePath = path.join(__dirname,'./proto/minion.proto');
    const packageDefinition = protoLoader.loadSync(protoFilePath,{
        longs:Number,
        keepCase: true,
        enums: String,
        defaults: true,
        oneofs: true
    })
    const minionProto = grpc.loadPackageDefinition(packageDefinition).minion;
    const server = new grpc.Server();

    server.addService(minionProto.Minion.service,{
        put:(call,callback)=>{
            const {blockId,data,minions} = call.request;
            min.min_put(blockId,data,minions);
            callback(null,null);
        }
    });

    server.bindAsync(`127.0.0.1:${port}`,grpc.ServerCredentials.createInsecure(),(err,port)=>{
        console.log("Minion server is listening at ",port);
    });
}

main();