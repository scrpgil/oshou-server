import nem from "nem-sdk";

class Main {
    test:boolean = true;
    websockets_endpoint:any;
    endpoint:any;
    address = "TCN57YPS6XUDWPY6GEMMIF6MEHNTPXKNKWYLVA7O";
    node_url = "http://153.122.112.137";
    network_id:number;

    constructor() {
        console.log("start...");
        this.websockets_endpoint = nem.model.objects.create("endpoint")(this.node_url, nem.model.nodes.websocketPort);
        this.endpoint = nem.model.objects.create("endpoint")(this.node_url, nem.model.nodes.defaultPort);
        this.connector();
    }
    connector(){
        // Testnet用
        this.network_id = nem.model.network.data.testnet.id;
        var connector = nem.com.websockets.connector.create(this.websockets_endpoint, this.address);
        connector.connect().then(()=> {
            nem.com.websockets.subscribe.account.transactions.confirmed(connector, (res)=> {
                console.log(res);
                let signer_address = nem.model.address.toAddress(res.transaction.signer, this.network_id);
                let amount = (res.transaction.amount / 1000000);
                if(this.address != signer_address && amount >= 1){
                    let faucet = amount - 0.25;
                    let priv_key = process.env.HOGE;
                    let common = nem.model.objects.create("common")("", priv_key);
                    let transferTransaction = nem.model.objects.create("transferTransaction")(signer_address, faucet, res.meta.hash.data);
                    let transactionEntity = nem.model.transactions.prepare("transferTransaction")(common, transferTransaction, this.network_id);
                    nem.model.transactions.send(common, transactionEntity, this.endpoint);
                    this.sendMosaic(signer_address, amount);
                }
            })
            nem.com.websockets.requests.account.transactions.recent(connector);
        },
        err => {
            console.error(err);
        });
    }

    sendMosaic(address, amount){
        let transferTransaction = nem.model.objects.create("transferTransaction")(address, 0, "");
        let mosaicAttachment2 = nem.model.objects.create("mosaicAttachment")("oshou.thank", "you", amount); 
        transferTransaction.mosaics.push(mosaicAttachment2);
        nem.com.requests.namespace.mosaicDefinitions(this.endpoint, mosaicAttachment2.mosaicId.namespaceId).then((res)=> {
            let neededDefinition = nem.utils.helpers.searchMosaicDefinitionArray(res.data, ["you"]);
            let fullMosaicName  = nem.utils.format.mosaicIdToName(mosaicAttachment2.mosaicId);
            if(undefined === neededDefinition[fullMosaicName]) return console.error("Mosaic not found !");
            let mosaicDefinitionMetaDataPair = nem.model.objects.get("mosaicDefinitionMetaDataPair");
            let priv_key = process.env.HOGE;
            let common = nem.model.objects.create("common")("", priv_key);
            mosaicDefinitionMetaDataPair[fullMosaicName] = {};
            mosaicDefinitionMetaDataPair[fullMosaicName].mosaicDefinition = neededDefinition[fullMosaicName];
            let transactionEntity = nem.model.transactions.prepare("mosaicTransferTransaction")(common, transferTransaction, mosaicDefinitionMetaDataPair, nem.model.network.data.testnet.id);
            transactionEntity.fee = 50000
            nem.model.transactions.send(common, transactionEntity, this.endpoint).then((res)=> {
                console.log(res);
            }, 
            (err)=> {
                console.error(err);
            });
        }, 
        (err)=> {
            console.error(err);
        });
    }
}

const main = new Main();
