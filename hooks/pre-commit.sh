#!/usr/bin/env bash

echo "**************** channel-artifacts, crypto-config files DELETE Start ****************"
rm -rf ./1.simpleMultiChanneling/network/channel-artifacts/*
rm -rf ./1.simpleMultiChanneling/network/crypto-config/*
echo "" >> ./1.simpleMultiChanneling/network/channel-artifacts/.gitkeep
echo "" >> ./1.simpleMultiChanneling/network/crypto-config/.gitkeep
echo "**************** channel-artifacts, crypto-config files DELETE Completed ****************"