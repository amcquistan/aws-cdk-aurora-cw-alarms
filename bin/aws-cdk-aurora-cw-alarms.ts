#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsCdkAuroraCwAlarmsStack } from '../lib/aws-cdk-aurora-cw-alarms-stack';

const app = new cdk.App();
new AwsCdkAuroraCwAlarmsStack(app, 'AwsCdkAuroraCwAlarmsStack', {
  dbName: process.env.DB_NAME!,
  dbUsername: process.env.DB_USERNAME!,
  dbPassword: process.env.DB_PASSWORD!,
  safeIp: process.env.SAFE_IP!
});
