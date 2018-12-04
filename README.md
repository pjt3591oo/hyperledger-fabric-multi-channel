# hyperledger fabric multi channel 구성



## 노드구성

* 채널 2개

  * test1
  * test2

* 기관 2개

  * org1
  * org2

* 피어 4개

  * peer0.org1
  * peer1.org1
  * peer0.org2
  * peer1.org2



## sample 코드 다운받기

* Sample 코드

```bash
$ git clone https://github.com/pjt3591oo/hyperledger-fabric-multi-channel.git
```



* binary 파일 다운로드

```bash
$ cd hyperledger-fabric-multi-channel
$ curl -sSL https://goo.gl/6wtTN5 | bash -s 1.1.0
```

바이너리 파일은 운영체제마다 달라지므로 직접 다운받아서 사용을 권장함. 

해당 프로젝트에 포함된 바이너리 파일은 MAC에서 받은 파일



## 설정파일 수정



* 피어 인증서 생성 파일

```bash
$ cd hyperledger-fabric-multi-channel/network
$ vim crypto-config.yaml
```



```yaml
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

OrdererOrgs:

  - Name: Orderer
    Domain: example.com
    Specs:
      - Hostname: orderer
PeerOrgs:
  # ---------------------------------------------------------------------------
  # Org1
  # ---------------------------------------------------------------------------
  - Name: Org1
    Domain: org1.example.com
    EnableNodeOUs: true
    Template:
      Count: 2
    Users:
      Count: 1

  # ---------------------------------------------------------------------------
  # Org1
  # ---------------------------------------------------------------------------
  - Name: Org2
    Domain: org2.example.com
    EnableNodeOUs: true
    Template:
      Count: 2
    Users:
      Count: 1
```



* Genesis, channel 정보 수정

```bash
$ cd hyperledger-fabric-multi-channel/network
$ vim configtx.yaml
```



```
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0

Profiles:
    TwoOrgsOrdererGenesis:
        Capabilities:
            <<: *ChannelCapabilities
        Orderer:
            <<: *OrdererDefaults
            Organizations:
                - *OrdererOrg
            Capabilities:
                <<: *OrdererCapabilities
        Consortiums:
            SampleConsortium:
                Organizations:
                    - *Org1
                    - *Org2
    TwoOrgsChannel1:
        Consortium: SampleConsortium
        Application:
            <<: *ApplicationDefaults
            Organizations:
                - *Org1
                - *Org2
            Capabilities:
                <<: *ApplicationCapabilities
    TwoOrgsChannel2:
        Consortium: SampleConsortium
        Application:
            <<: *ApplicationDefaults
            Organizations:
                - *Org1
            Capabilities:
                <<: *ApplicationCapabilities

Organizations:
    - &OrdererOrg
        Name: OrdererOrg
        ID: OrdererMSP
        MSPDir: crypto-config/ordererOrganizations/example.com/msp
    - &Org1
        Name: Org1MSP
        ID: Org1MSP
        MSPDir: crypto-config/peerOrganizations/org1.example.com/msp
        AnchorPeers:
            - Host: peer0.org1.example.com
              Port: 7051
    - &Org2
        Name: Org2MSP
        ID: Org2MSP
        MSPDir: crypto-config/peerOrganizations/org2.example.com/msp
        AnchorPeers:
            - Host: peer0.org2.example.com
              Port: 7051

Orderer: &OrdererDefaults
    OrdererType: solo
    Addresses:
        - orderer.example.com:7050
    BatchTimeout: 2s
    BatchSize:
        MaxMessageCount: 10
        AbsoluteMaxBytes: 99 MB
        PreferredMaxBytes: 512 KB
    Kafka:
        Brokers:
            - 127.0.0.1:9092
    Organizations:

Application: &ApplicationDefaults
    Organizations:

Capabilities:
    Global: &ChannelCapabilities
        V1_1: true
    Orderer: &OrdererCapabilities
        V1_1: true
    Application: &ApplicationCapabilities
        V1_1: true
```



> 참고: Profiles는 크게 2가지 형태의 파일을 만들어 줍니다. 첫 번째, orderer 노드가 어떤 기관의 anchor 피어로 전파할 지 정의를 해줌. 두 번째, 채널에 어떤 기관을 가입할 지 명시함.



앞의 코드에서 `TwoOrgsOrdererGenesis`는 orderer 노드가 어떤 기관의 anchor 피어로 전달할 지 명시합니다. 또한, 전달 방식을 solo, Kafka 등 선택할 수 있습니다. 추후에는 `SBFT` 알고리즘도 사용가능하다고 함. 

다음으로 해당 `TwoOrgsChannel1`, `TwoOrgsChannel2` 처럼 채널에 어떤 기관을 가입시킬지 명시합니다.





## 인증서 파일 생성

```bash
$ ../bin/cryptogen generate --config=./crypto-config.yaml
```

cryptogen을 이용하여 crypto-config.yaml에 정의한 갯수만큼 orderer와 peer 인증서 생성을 합니다.



## genesis block 생성

```bash
$ export FABRIC_CFG_PATH=$PWD
$ ../bin/configtxgen -profile TwoOrgsOrdererGenesis -outputBlock ./channel-artifacts/genesis.block
```





## 채널 구성 트랜잭션 생성



* test1 채널 생성

```bash
$ export CHANNEL_NAME=test1  
$ ../bin/configtxgen -profile TwoOrgsChannel1 -outputCreateChannelTx ./channel-artifacts/test1.tx -channelID $CHANNEL_NAME
```



* test2 채널 생성

```bash
$ export CHANNEL_NAME=test2
$ ../bin/configtxgen -profile TwoOrgsChannel2 -outputCreateChannelTx ./channel-artifacts/test2.tx -channelID $CHANNEL_NAME
```



## 앵커피어 설정



###  `test1 채널`



* org1 앵커피어 설정

```bash
$ ../bin/configtxgen -profile TwoOrgsChannel1 -outputAnchorPeersUpdate ./channel-artifacts/Org1MSPanchors_ch_test1.tx -channelID test1 -asOrg Org1MSP
```



* org2 앵커피어 설정

```
$ ../bin/configtxgen -profile TwoOrgsChannel1 -outputAnchorPeersUpdate ./channel-artifacts/Org2MSPanchors_ch_test1.tx -channelID test1 -asOrg Org2MSP
```



### `test2 채널`



* org1 앵커피어 설정

```bash
$ ../bin/configtxgen -profile TwoOrgsChannel2 -outputAnchorPeersUpdate ./channel-artifacts/Org1MSPanchors_ch_test2.tx -channelID test2 -asOrg Org1MSP
```

지금까지 노드를 구성하기 위한 인증서 생성및 block, tranaction 파일생성이 완료됬습니다.



## 생성된 파일 확인

```bash
$ cd channel-artifacts/
$ ls -ahl
-rw-r--r--   1 pjt  staff   276B 12  4 16:07 Org1MSPanchors_ch_test1.tx
-rw-r--r--   1 pjt  staff   276B 12  4 16:09 Org1MSPanchors_ch_test2.tx
-rw-r--r--   1 pjt  staff   276B 12  4 16:08 Org2MSPanchors_ch_test1.tx
-rw-r--r--   1 pjt  staff    12K 12  4 16:03 genesis.block
-rw-r--r--   1 pjt  staff   338B 12  4 16:04 test1.tx
-rw-r--r--   1 pjt  staff   312B 12  4 16:05 test2.tx
```





## 네트워크 구동

```bash
$ docker-compose -f docker-compose-cli.yaml up
```

-d 옵션을 넣으면 한 터미널에서 작업이 가능하지만 로그를 보면서 진행하기 위해 터미널 하나를 더 띄워줍니다.



## cli 점속

```bash
$ docker exec -it cli /bin/bash
```

우리는 이제 패브릭 기반으로 인프라를 구축할 때 각 노드를 직접 들어가지 않고 cli를 통해서 제어합니다. 하지만 cli에서 제어할 땐 어느 서버에 명령을 전달할지 알아야 하기 때문에 환경변수를 매번 바꿔서 사용해야 합니다.



## 채널생성

```bash
$ ls
channel-artifacts  crypto  scripts
```

docker-compose-cli.yaml에서 channel-artifacts와 crypto-config를 volue으로 공유를 했기 때문에 설정파일들을 cli 컨테이너에서 사용하여 각 노드들을 참가하고 제어할 수 있습니다.



* test1 채널생성

```bash
$ export CHANNEL_NAME=test1
$ peer channel create -o orderer.example.com:7050 -c test1 -f ./channel-artifacts/test1.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
```



* test2 채널생성

```bash
$ export CHANNEL_NAME=test2
$ peer channel create -o orderer.example.com:7050 -c test2 -f ./channel-artifacts/test2.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
```



* 채널생성 확인

```bash
$ ls -ahl
total 36K
drwxr-xr-x  5 root root 4.0K Dec  4 07:18 .
drwxr-xr-x  3 root root 4.0K Dec  4 07:11 ..
drwxr-xr-x  9 root root  306 Dec  4 07:09 channel-artifacts
drwxr-xr-x  4 root root  136 Dec  4 07:03 crypto
drwxr-xr-x 10 root root  340 Dec  4 02:37 scripts
-rw-r--r--  1 root root  16K Dec  4 07:18 test1.block
-rw-r--r--  1 root root  11K Dec  4 07:18 test2.block
```



채널 파일을 block 파일로 만들어 줍니다.



## 채널참가

앞에서 만든 `test1.block`과 `test2.block`을 이용하여 각 피어들을 채널에 참가시켜 줍니다. 이 것도 마찬가지로 cli 컨테이너에 접속된 상태에서 명령어를 계속합니다.



* org1 peer0 피어 test1, test2 채널 참가

```bash
$ CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

$ CORE_PEER_ADDRESS=peer0.org1.example.com:7051

$ CORE_PEER_LOCALMSPID="Org1MSP"

$ CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

$ peer channel join -b test1.block
$ peer channel join -b test2.block
```



* org1 peer1 피어 test1, test2 채널 참가

```bash
$ CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

$ CORE_PEER_ADDRESS=peer1.org1.example.com:7051

$ CORE_PEER_LOCALMSPID="Org1MSP"

$ CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/ca.crt

$ peer channel join -b test1.block
$ peer channel join -b test2.block
```



* org2 peer0 피어 test1 채널 참가

```bash
$ CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp

$ CORE_PEER_ADDRESS=peer0.org2.example.com:7051

$ CORE_PEER_LOCALMSPID="Org2MSP"

$ CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

$ peer channel join -b test1.block
```



* org2 peer1 피어 test1채널 참가

```bash
$ CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp

$ CORE_PEER_ADDRESS=peer1.org2.example.com:7051

$ CORE_PEER_LOCALMSPID="Org2MSP"

$ CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/tls/ca.crt

$ peer channel join -b test1.block
```



## 앵커피어 업데이트

이제 각 채널의 기관에서 앵커피어를 업데이트 합니다. 이것도 마찬가지로 cli 컨테이너에 접속된 상태를 유지하고 명령어를 전달합니다.



* test1 채널 org1 peer0 앵커피어 설정

```bash
$ export CHANNEL_NAME=test1

$ CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp CORE_PEER_ADDRESS=peer0.org1.example.com:7051 CORE_PEER_LOCALMSPID="Org1MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt peer channel update -o orderer.example.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/Org1MSPanchors_ch_test1.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
```



* test1 채널 org2 peer0 앵커피어 설정

```bash
$ export CHANNEL_NAME=test1

$ CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp CORE_PEER_ADDRESS=peer0.org2.example.com:7051 CORE_PEER_LOCALMSPID="Org2MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt peer channel update -o orderer.example.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/Org2MSPanchors_ch_test1.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
```



* test2 채널 org1 peer0 앵커피어 설정

```bash
$ export CHANNEL_NAME=test2

$ CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp CORE_PEER_ADDRESS=peer0.org1.example.com:7051 CORE_PEER_LOCALMSPID="Org1MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt peer channel update -o orderer.example.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/Org1MSPanchors_ch_test2.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
```



여기까지 채널 생성 및 노드구성이 끝났습니다. 이제부턴 각 채널에 체인코드 배포를 합니다.



## 체인코드 배포

각 피어에 접속하여 `install`을 한 후` instantiate`을 합니다.



### `체인코드 설치`

test1과 test2 각각 체인코드를 설치합니다.



#### test1 채널 체인코드 설치

* test1채널 peer0.org1 

```bash
$ CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

$ CORE_PEER_ADDRESS=peer0.org1.example.com:7051

$ CORE_PEER_LOCALMSPID="Org1MSP"

$ CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

$ peer chaincode install -n mycc -v 1.0 -p github.com/chaincode/chaincode_example02/go
```

체인코드 배포시 옵션은 다음과 같습니다.

n`: 체인코드 이름

`v`: 체인코드 버전

`p`: 배포할 체인코드 경로



* test1채널 peer1.org1

```bash
$ CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

$ CORE_PEER_ADDRESS=peer1.org1.example.com:7051

$ CORE_PEER_LOCALMSPID="Org1MSP"

$ CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/ca.crt

$ peer chaincode install -n mycc -v 1.0 -p github.com/chaincode/chaincode_example02/go
```



* test1채널 peer0.org2

```bash
$ CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp

$ CORE_PEER_ADDRESS=peer0.org2.example.com:7051

$ CORE_PEER_LOCALMSPID="Org2MSP"

$ CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

$ peer chaincode install -n mycc -v 1.0 -p github.com/chaincode/chaincode_example02/go
```



* test1채널 peer1.org2

```bash
$ CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp

$ CORE_PEER_ADDRESS=peer1.org2.example.com:7051

$ CORE_PEER_LOCALMSPID="Org2MSP"

$ CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/tls/ca.crt

$ peer chaincode install -n mycc -v 1.0 -p github.com/chaincode/chaincode_example02/go
```



* 각 피어에 전달된 체인코드 배포

```bash
$ export CHANNEL_NAME=test1
$ 
CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

$ CORE_PEER_ADDRESS=peer0.org1.example.com:7051

$ CORE_PEER_LOCALMSPID="Org1MSP"

$ CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

$ peer chaincode instantiate -o orderer.example.com:7050 --tls $CORE_PEER_TLS_ENABLED --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C $CHANNEL_NAME -n mycc -v 1.0 -c '{"Args":["init","a", "100", "b","200"]}' -P "OR ('Org1MSP.member','Org2MSP.member')"
```

instantiate는 한번만 해주어도 됨. 오더 노드가 해당 해당 채널에 있는 기관 앵커피어에게 전달하고 앵커 피어는 하위 피어에게 전달함



#### test2 채널 체인코드 설치

여기서는 org1이 test1, test2에 모두 참가하기 때문에 org1은 이미 체인코드가 설치 되어있습니다 (앞에서 install을 이미 했기 때문에). 해당 채널에서 install 없이 instantiate 해주면 됨.

 만약, test1에 포함되지 않은 다른 기관이 있다면 앞의 방식대로 install한 후 instantiate 함.

```bash
$ export CHANNEL_NAME=test2

$ 
CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp

$ CORE_PEER_ADDRESS=peer0.org1.example.com:7051

$ CORE_PEER_LOCALMSPID="Org1MSP"

$ CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

$ peer chaincode instantiate -o orderer.example.com:7050 --tls $CORE_PEER_TLS_ENABLED --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C $CHANNEL_NAME -n mycc -v 1.0 -c '{"Args":["init","a", "100", "b","200"]}' -P "OR ('Org1MSP.member')"
```



## 체인코드 테스트

체인코드를 호출할 때 채널을 반드시 명시해야 함.



* query 호출

```bash
$ export CHANNEL_NAME=test1
$ peer chaincode query -C $CHANNEL_NAME -n mycc -c '{"Args":["query","a"]}' 

2018-12-04 07:50:50.091 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
2018-12-04 07:50:50.092 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
Query Result: 100
2018-12-04 07:50:50.100 UTC [main] main -> INFO 003 Exiting.....


$ export CHANNEL_NAME=test2
$ peer chaincode query -C $CHANNEL_NAME -n mycc -c '{"Args":["query","a"]}' 

2018-12-04 07:50:54.851 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
2018-12-04 07:50:54.852 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
Query Result: 100
2018-12-04 07:50:54.856 UTC [main] main -> INFO 003 Exiting.....
```



* Invoke 호출

```bash
$ export CHANNEL_NAME=test1
$ peer chaincode invoke -o orderer.example.com:7050  --tls $CORE_PEER_TLS_ENABLED --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem  -C $CHANNEL_NAME -n mycc -c '{"Args":["invoke","a","b","10"]}'

2018-12-04 07:51:49.236 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
2018-12-04 07:51:49.236 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
2018-12-04 07:51:49.246 UTC [chaincodeCmd] chaincodeInvokeOrQuery -> INFO 003 Chaincode invoke successful. result: status:200 
2018-12-04 07:51:49.246 UTC [main] main -> INFO 004 Exiting.....
```

test1 채널에서만 invoke를 발생시켜 데이터 변화를 일으킵니다.



* 채널 데이터 확인

```bash
$ export CHANNEL_NAME=test1
$ peer chaincode query -C $CHANNEL_NAME -n mycc -c '{"Args":["query","a"]}' 

2018-12-04 07:52:58.931 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
2018-12-04 07:52:58.931 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
Query Result: 90
2018-12-04 07:52:58.937 UTC [main] main -> INFO 003 Exiting.....

$ export CHANNEL_NAME=test2
$ peer chaincode query -C $CHANNEL_NAME -n mycc -c '{"Args":["query","a"]}' 

2018-12-04 07:53:07.376 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
2018-12-04 07:53:07.376 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
Query Result: 100
2018-12-04 07:53:07.388 UTC [main] main -> INFO 003 Exiting.....
```

test1 채널의 데이터만 바뀌었습니다.



## 네트워크 완전 내리기

docker-compose로 네트워드 구동한 `ctrl + c`를 입력하여 빠져나온 후 다음 명령어를 입력합니다.



```bash
$ docker stop $(docker ps -qa)
$ docker rm $(docker ps -qa)
```

>  `$(docker ps -qa)`로 삭제할 경우 fabric 이외의 컨테이너들도 stop, rm될 수 있으니 조심할 것



```bash
$ docker volume prune
$ docker network prune
```



