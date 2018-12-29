# network with kafka

## 노드구성

* 채널 1개
    
    * mychannel

* 기관 2개

  * org1
  * org2

* 피어 4개

  * peer0.org1
  * peer1.org1
  * peer0.org2
  * peer1.org2

* orderer 2개

    * orderer0
    * orderer1

* kafka

    * kafka1
    * kafka2
    * kafka3

* zookeeper
    
    * zookeeper1
    * zookeeper2
    * zookeeper3


## sample 코드 다운받기

* Sample 코드

```bash
$ git clone https://github.com/pjt3591oo/hyperledger-fabric-multi-channel.git
$ cd hyperledger-fabric-multi-channel
$ cd 4.kafka
$ cd network
```

## 인증서 파일 생성

```bash
$ ../bin/cryptogen generate --config=./crypto-config.yaml
```

## genesis block 생성

```bash
$ export FABRIC_CFG_PATH=$PWD
$ ../bin/configtxgen -profile TwoOrgsOrdererGenesis -outputBlock ./channel-artifacts/genesis.block
```


## 채널 구성 트랜잭션 생성

* mychannel 채널 생성

```bash
$ export CHANNEL_NAME=mychannel
$ ../bin/configtxgen -profile TwoOrgsChannel -outputCreateChannelTx ./channel-artifacts/channel.tx -channelID $CHANNEL_NAME
```

## 앵커피어 설정

### `mychannel 채널`

* org1

```bash
$ ../bin/configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/Org1MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org1MSP
```

* org2

```bash
$ ../bin/configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate  ./channel-artifacts/Org2MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org2MSP
```

## 네트워크 구동

```bash
$ docker-compose -f docker-compose-fakfa.yaml up
```

`-d` 옵션을 넣으면 한 터미널에서 작업이 가능하지만 로그를 보면서 진행하기 위해 터미널 하나를 더 띄워줍니다.

## cli 접속

새로운 터미널 창에서 아래 명령어를 수행합니다.

```bash
$ docker exec -it cli bash
```

## 채널생성

* mychannel 채널 생성

```bash
$ export CHANNEL_NAME=mychannel 
$ peer channel create -o orderer0.example.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx --tls $CORE_PEER_TLS_ENABLED --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer0.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
```

여기서 orderer0으로 채널 생성하는데 orderer1로 해도 상관없음.

orderer는 단순히 전달 역할만 할 뿐이다...

* 채널생성 확인

```bash
$ ls -ahl
total 24K
drwxr-xr-x  5 root root 4.0K Dec 29 01:39 .
drwxr-xr-x  3 root root 4.0K Dec 29 01:22 ..
drwxr-xr-x  7 root root  238 Dec 29 01:20 channel-artifacts
drwxr-xr-x  5 root root  170 Dec 29 01:23 crypto
-rw-r--r--  1 root root  16K Dec 29 01:39 mychannel.block
drwxr-xr-x 10 root root  340 Dec 26 01:55 scripts
```

## 채널참가

* org1 peer0 피어 mychannel 채널 참가

```bash
$ CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

$ CORE_PEER_ADDRESS=peer0.org1.example.com:7051

$ CORE_PEER_LOCALMSPID="Org1MSP"

$ CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

$ peer channel join -b mychannel.block
```

* org1 peer1 피어 mychannel 채널 참가

```bash
$ CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

$ CORE_PEER_ADDRESS=peer1.org1.example.com:7051

$ CORE_PEER_LOCALMSPID="Org1MSP"

$ CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/ca.crt

$ peer channel join -b mychannel.block
```

* org2 peer0 피어 mychannel 채널 참가

```bash
$ CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp

$ CORE_PEER_ADDRESS=peer0.org2.example.com:7051

$ CORE_PEER_LOCALMSPID="Org2MSP"

$ CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

$ peer channel join -b mychannel.block
```

* org2 peer1 피어 mychannel 채널 참가

```bash
$ CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp

$ CORE_PEER_ADDRESS=peer1.org2.example.com:7051

$ CORE_PEER_LOCALMSPID="Org2MSP"

$ CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/tls/ca.crt

$ peer channel join -b mychannel.block
```

## 앵커피어 업데이트

이제 각 채널의 기관에서 앵커피어를 업데이트 합니다. 이것도 마찬가지로 cli 컨테이너에 접속된 상태를 유지하고 명령어를 전달합니다.


* mychannel 채널 org1 peer0 앵커피어 설정

```bash
$ export CHANNEL_NAME=mychannel

$  CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp 

$ CORE_PEER_ADDRESS=peer0.org1.example.com:7051 

$ CORE_PEER_LOCALMSPID="Org1MSP" 

$ CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt 

$ peer channel update -o orderer0.example.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/Org1MSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer0.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
```

* mychannel 채널 org2 peer0 앵커피어 설정

```bash
$ export CHANNEL_NAME=mychannel

$ CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp 

$ CORE_PEER_ADDRESS=peer0.org2.example.com:7051 

$ CORE_PEER_LOCALMSPID="Org2MSP" 

$ CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt 

$ peer channel update -o orderer0.example.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/Org2MSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer0.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
```

## 체인코드 배포

각 피어에 접속하여 `install`을 한 후` instantiate`을 합니다.

### `체인코드 설치`

mychannel에 참가된 피어들에게 체인코드 설치한다.


* mychannel채널 peer0.org1 

```bash
$ CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

$ CORE_PEER_ADDRESS=peer0.org1.example.com:7051

$ CORE_PEER_LOCALMSPID="Org1MSP"

$ CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

$ peer chaincode install -n mycc -v 1.0 -p github.com/chaincode/chaincode_example02/go
```

체인코드 배포시 옵션은 다음과 같습니다.

`n`: 체인코드 이름

`v`: 체인코드 버전

`p`: 배포할 체인코드 경로

* mychannel채널 peer1.org1 

```bash
$ CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

$ CORE_PEER_ADDRESS=peer1.org1.example.com:7051

$ CORE_PEER_LOCALMSPID="Org1MSP"

$ CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/ca.crt

$ peer chaincode install -n mycc -v 1.0 -p github.com/chaincode/chaincode_example02/go
```

* mychannel채널 peer0.org2

```bash
$ CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp

$ CORE_PEER_ADDRESS=peer0.org2.example.com:7051

$ CORE_PEER_LOCALMSPID="Org2MSP"

$ CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

$ peer chaincode install -n mycc -v 1.0 -p github.com/chaincode/chaincode_example02/go
```

* mychannel채널 peer1.org2

```bash
$ CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp

$ CORE_PEER_ADDRESS=peer1.org2.example.com:7051

$ CORE_PEER_LOCALMSPID="Org2MSP"

$ CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/tls/ca.crt

$ peer chaincode install -n mycc -v 1.0 -p github.com/chaincode/chaincode_example02/go
```

* 각 피어에 전달된 체인코드 배포

```bash
$ export CHANNEL_NAME=mychannel

$ 
CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

$ CORE_PEER_ADDRESS=peer0.org1.example.com:7051

$ CORE_PEER_LOCALMSPID="Org1MSP"

$ CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

$ peer chaincode instantiate -o orderer0.example.com:7050 --tls $CORE_PEER_TLS_ENABLED --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer0.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C $CHANNEL_NAME -n mycc -v 1.0 -c '{"Args":["init","a", "100", "b","200"]}' -P "OR ('Org1MSP.member','Org2MSP.member')"
```

instantiate는 한번만 해주어도 됨. 오더 노드가 해당 해당 채널에 있는 기관 리더피어에게 전달하고 리더 피어는 하위 피어에게 전달함

## 체인코드 테스트

체인코드를 호출할 때 채널을 반드시 명시해야 함.

* query 호출

```bash
$ export CHANNEL_NAME=mychannel

$ CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

$ CORE_PEER_ADDRESS=peer0.org1.example.com:7051

$ CORE_PEER_LOCALMSPID="Org1MSP"

$ CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

$ peer chaincode query -C $CHANNEL_NAME -n mycc -c '{"Args":["query","a"]}' 

2018-12-04 07:50:50.091 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
2018-12-04 07:50:50.092 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
Query Result: 100
2018-12-04 07:50:50.100 UTC [main] main -> INFO 003 Exiting.....
```

* Invoke 호출

```bash
$ export CHANNEL_NAME=mychannel

$ CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

$ CORE_PEER_ADDRESS=peer0.org1.example.com:7051

$ CORE_PEER_LOCALMSPID="Org1MSP"

$ CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

$ peer chaincode invoke -o orderer0.example.com:7050  --tls $CORE_PEER_TLS_ENABLED --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer0.example.com/msp/tlscacerts/tlsca.example.com-cert.pem  -C $CHANNEL_NAME -n mycc -c '{"Args":["invoke","a","b","10"]}'

2018-12-04 07:51:49.236 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
2018-12-04 07:51:49.236 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
2018-12-04 07:51:49.246 UTC [chaincodeCmd] chaincodeInvokeOrQuery -> INFO 003 Chaincode invoke successful. result: status:200 
2018-12-04 07:51:49.246 UTC [main] main -> INFO 004 Exiting.....
```