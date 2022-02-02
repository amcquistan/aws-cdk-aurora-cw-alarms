import { Stack, StackProps, CfnOutput, Duration, SecretValue } from 'aws-cdk-lib';
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from 'constructs';


export interface AwsCdkAutoraCwAlarmsStackProps extends StackProps {
  readonly safeIp: string;
  readonly dbUsername: string;
  readonly dbPassword: string;
  readonly dbName: string;
}

export class AwsCdkAuroraCwAlarmsStack extends Stack {
  constructor(scope: Construct, id: string, props: AwsCdkAutoraCwAlarmsStackProps) {
    super(scope, id, props);

    // VPC with 2 public subnets across two availability zone
    const vpc = new ec2.Vpc(this, 'DbVpc', {
      cidr: '10.0.0.0/20',
      maxAzs: 2,
      natGateways: 0
    });

    // Security group to allow connects to database from my home IP
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc,
      description: 'Aurora Postgres Security Group',
      allowAllOutbound: true
    });
    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.safeIp),
      ec2.Port.tcp(5432),
      'Allow TCP/Postgres Connection from SafeIP on Port 5432'
    );


    // Aurora Postgres Database Cluster of 1 Writer and 1 Reader
    const dbCluster = new rds.DatabaseCluster(this, 'DbCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_13_4
      }),
      credentials: rds.Credentials.fromPassword(
        props.dbUsername,
        SecretValue.plainText(props.dbPassword),
      ),
      defaultDatabaseName: props.dbName,
      instances: 2, // one writer and one reader
      instanceProps: {
        vpc,
        publiclyAccessible: true,
        securityGroups: [ dbSecurityGroup ],
        vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC }
      }
    });

    // CPU Utilization CloudWatch Metric Averaged over 2 mins
    // for DB Cluster, Writer Instance and Reader Instance
    const dbCpuMetric = dbCluster.metricCPUUtilization({
      period: Duration.minutes(2)
    });
    const dbWriterCpuMetric = dbCluster.metricCPUUtilization({
      period: Duration.minutes(2),
      dimensionsMap: { Role: 'WRITER' }
    });
    const dbReaderCpuMetric = dbCluster.metricCPUUtilization({
      period: Duration.minutes(2),
      dimensionsMap: { Role: 'READER' }
    });

    // CloudWatch alarms for CPU Utilization metrics set to
    // alarm state when CPU os over 30 percent at
    // DB Cluster, Writer and Reader instances
    const dbCpuAlarm = dbCpuMetric.createAlarm(this, 'DbCpuAlarm', {
      evaluationPeriods: 1,
      alarmDescription: "Cluster CPU Over 30 Percent",
      threshold: 30
    });
    const dbWriterCpuAlarm = dbWriterCpuMetric.createAlarm(this, 'DbWriterCpuAlarm', {
      evaluationPeriods: 1,
      alarmDescription: "Writer CPU Over 30 Percent",
      threshold: 30
    });
    const dbReaderCpuAlarm = dbReaderCpuMetric.createAlarm(this, 'DbReaderCpuAlarm', {
      evaluationPeriods: 1,
      alarmDescription: "Reader CPU Over 30 Percent",
      threshold: 30
    });

    // CloudFormation stack outputs for easy lookup
    new CfnOutput(this, 'DbCpuMetricName', {
      value: dbCpuMetric.metricName
    });
    new CfnOutput(this, 'DbWriterCpuMetricName', {
      value: dbWriterCpuMetric.metricName
    });
    new CfnOutput(this, 'DbReaderCpuMetricName', {
      value: dbReaderCpuMetric.metricName
    });

    new CfnOutput(this, 'DbCpuAlarmName', {
      value: dbCpuAlarm.alarmName
    });
    new CfnOutput(this, 'DbWriterCpuAlarmName', {
      value: dbWriterCpuAlarm.alarmName
    });
    new CfnOutput(this, 'DbReaderCpuAlarmName', {
      value: dbReaderCpuAlarm.alarmName
    });

    new CfnOutput(this, 'DbWriterEndpoint', {
      value: dbCluster.clusterEndpoint.socketAddress
    });
    new CfnOutput(this, 'DbReaderEndpoint', {
      value: dbCluster.clusterReadEndpoint.socketAddress
    });
  }
}
