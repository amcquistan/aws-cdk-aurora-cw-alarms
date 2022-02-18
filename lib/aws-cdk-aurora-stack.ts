import { Stack, StackProps, CfnOutput, SecretValue } from 'aws-cdk-lib';
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from 'constructs';


export interface AwsCdkAuroraStackProps extends StackProps {
  readonly safeIp: string;
  readonly dbUsername: string;
  readonly dbPassword: string;
  readonly dbName: string;
}

export class AwsCdkAuroraStack extends Stack {
  readonly dbCluster: rds.DatabaseCluster;

  constructor(scope: Construct, id: string, props: AwsCdkAuroraStackProps) {
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

    const rdsEngine = rds.DatabaseClusterEngine.auroraPostgres({
      version: rds.AuroraPostgresEngineVersion.VER_13_4
    });
    const rdsParamGroup = new rds.ParameterGroup(this, 'SlowQueryParamsGrp', {
      engine: rdsEngine,
      description: 'Aurora PostgreSQL Cluster Parameter Group with Slow Query Logging',
      parameters: {
        log_min_duration_statement: '1500'
      }
    });

    this.dbCluster = new rds.DatabaseCluster(this, 'DbCluster', {
      engine: rdsEngine,
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: logs.RetentionDays.THREE_DAYS,
      parameterGroup: rdsParamGroup,
      credentials: rds.Credentials.fromPassword(
        props.dbUsername,
        SecretValue.plainText(props.dbPassword),
      ),
      defaultDatabaseName: props.dbName,
      instances: 1,
      instanceProps: {
        vpc,
        publiclyAccessible: true,
        securityGroups: [ dbSecurityGroup ],
        vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC }
      }
    });

    new CfnOutput(this, 'DbClientEndpoint', {
      value: `postgresql://${props.dbUsername}:${props.dbPassword}@${this.dbCluster.clusterEndpoint.hostname}:5432/${props.dbName}`
    });
    new CfnOutput(this, 'ClusterLogGroup', {
      value: `/aws/rds/cluster/${this.dbCluster.clusterIdentifier}/postgresql`
    });
  }
}
