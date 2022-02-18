#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsCdkAuroraStack } from '../lib/aws-cdk-aurora-stack';
import { AwsCdkCloudWatchStack } from '../lib/aws-cdk-cloudwatch-stack';

const app = new cdk.App();
const auroraStack = new AwsCdkAuroraStack(app, 'AwsCdkAuroraStack', {
  dbName: process.env.DB_NAME || 'appdb',
  dbUsername: process.env.DB_USERNAME || 'appuser',
  dbPassword: process.env.DB_PASSWORD || 'SomePassword',
  safeIp: process.env.SAFE_IP || 'YOUR_IP/32'
});

const cwStack = new AwsCdkCloudWatchStack(app, 'AwsCdkAuroraAlarmsStack', {
  dbCluster: auroraStack.dbCluster,
  email: process.env.EMAIL || 'YOUR_EMAIL_ADDRESS'
});
