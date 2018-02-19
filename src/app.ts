import nem from "nem-sdk";

class Main {
    test:boolean = true;
    endpoint:any;
    address = "TDYPKQ2ZVV6BPDLOZ4CMGTXD2MCAFC7DVEN7V4ZM";
    node_url = "http://153.122.112.137";
    network_id:number;

    constructor() {
        console.log("start...");
        this.connector();
    }
    connector(){
        // Testnet用
        this.network_id = nem.model.network.data.testnet.id;
        this.endpoint = nem.model.objects.create("endpoint")(this.node_url, nem.model.nodes.websocketPort);
        var connector = nem.com.websockets.connector.create(this.endpoint, this.address);
        connector.connect().then(()=> {
            nem.com.websockets.subscribe.account.transactions.confirmed(connector, (res)=> {
                console.log(res);
                var signer_address = nem.model.address.toAddress(res.transaction.signer, this.network_id);
                if(this.address != signer_address){
                    var priv_key = process.env.HOGE;
                    var common = nem.model.objects.create("common")("", priv_key);
                    var endpoint = nem.model.objects.create("endpoint")(this.node_url, nem.model.nodes.defaultPort);
                    var transferTransaction = nem.model.objects.create("transferTransaction")(signer_address, 0.1, "ありがたやありがたや." + res.meta.hash.data);
                    var transactionEntity = nem.model.transactions.prepare("transferTransaction")(common, transferTransaction, this.network_id);
                    nem.model.transactions.send(common, transactionEntity, endpoint);
                }
            })
            nem.com.websockets.requests.account.transactions.recent(connector);
        },
        err => {
            console.error(err);
        });
    }
}

const main = new Main();
