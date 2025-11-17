#!/bin/bash

ENV=$1
echo "Setting configuration for environment: $ENV"

# Copy the appropriate config file
cp src/config/config.$ENV.ts src/config/index.ts
