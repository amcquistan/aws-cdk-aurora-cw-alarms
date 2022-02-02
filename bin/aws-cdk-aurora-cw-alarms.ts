#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsCdkAuroraCwAlarmsStack } from '../lib/aws-cdk-aurora-cw-alarms-stack';

const app = new cdk.App();
new AwsCdkAuroraCwAlarmsStack(app, 'AwsCdkAuroraCwAlarmsStack', {
  dbName: process.env.DB_NAME || 'appdb',
  dbUsername: process.env.DB_USERNAME || 'appuser',
  dbPassword: process.env.DB_PASSWORD || 'SomePassword',
  safeIp: process.env.SAFE_IP || 'YOUR_IP/32'
});
