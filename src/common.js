const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('node:path');

module.exports = { connectToGrpcMinionServer(protoFilePath,host,port){
    const protoFilePathFull = path.join(__dirname,protoFilePath);

    const packageDefinition = protoLoader.loadSync(protoFilePathFull,{
        longs:Number,
        keepCase: true,
        enums: String,
        defaults: true,
        oneofs: true
    })

    const proto = grpc.loadPackageDefinition(packageDefinition).minion;

    const client = new proto.Minion(`${host}:${port}`,grpc.credentials.createInsecure());

    return client;

}

}