const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('node:path');
const fs = require('node:fs');
const {connectToGrpcMinionServer} = require('./common');

function put_file(masterClient,srcFilePath,destFileName){
    let fileSize = fs.statSync(srcFilePath).size;

     masterClient.put_file({fileName:destFileName,fileSize},(error,resp)=>{
        if(error){
            console.log("error is ",error);
            return;
        }
        
        const readStream = fs.createReadStream(srcFilePath,{highWaterMark:100});
        let blockIndex = 0;
        readStream.on('data', (chunk) => {
            console.log(`Read ${chunk.length} bytes:`, chunk);
            const {block_id,block_addr} = resp.blocks[blockIndex];
            const {ip,port} = block_addr[0];
            const minionClient = connectToGrpcMinionServer('./proto/minion.proto',ip,port);

            minionClient.put({blockId:block_id,data:chunk,minions:block_addr.slice(1)},(error,resp)=>{
                if(error){
                    console.log("error is ",error);
                    return;
                }
                console.log("Block forwarded to ", ip, port);
            });

            blockIndex++;
          });
          
        readStream.on('end', () => {
            console.log('Finished reading file');
          });
          
        readStream.on('error', (err) => {
            console.error(`Error reading file: ${err}`);
          });
    });

}


function main(){
    const protoFilePath = path.join(__dirname,'./proto/master.proto');
    const packageDefinition = protoLoader.loadSync(protoFilePath,{
        longs:Number,
        keepCase: true,
        enums: String,
        defaults: true,
        oneofs: true
    })

    const argv1  = process.argv.slice(2);
    const op = argv1[0].trim();
    let srcFilePath = argv1[1];
    let destFileName = argv1[2];


    const masterProto = grpc.loadPackageDefinition(packageDefinition).master;

    const client = new masterProto.Master('127.0.0.1:8000',grpc.credentials.createInsecure());


    if(op === 'get'){

    }else if(op === 'put'){
        put_file(client,srcFilePath,destFileName);
    }else{
        console.log("Invalid operation");
    }




}

main();