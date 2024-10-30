const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('node:path');


function main(){
    const protoFilePath = path.join(__dirname,'./proto/master.proto');
    const packageDefinition = protoLoader.loadSync(protoFilePath,{
        longs:Number,
        keepCase: true,
        enums: String,
        defaults: true,
        oneofs: true
    })

    const masterProto = grpc.loadPackageDefinition(packageDefinition).master;

    const client = new masterProto.Master('127.0.0.1:8000',grpc.credentials.createInsecure());

    client.put_file({fileName:'abc.txt',fileSize:100},(error,resp)=>{
        if(error){
            console.log("error is ",error);
            return;
        }
        console.log("Response is ",resp);
    })

}

main();