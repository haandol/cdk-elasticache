import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import { Config } from '../configs/loader';

interface IProps extends StackProps {
  vpc: ec2.IVpc;
}

export class CacheStack extends Stack {
  public readonly replicationGroup: elasticache.CfnReplicationGroup;
  public readonly securityGroup: ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, props: IProps) {
    super(scope, id, props);

    this.securityGroup = new ec2.SecurityGroup(
      this,
      'ElastiCacheSecurityGroup',
      {
        securityGroupName: `${Config.Ns}ElastiCacheSecurityGroup`,
        vpc: props.vpc,
      }
    );
    this.securityGroup.connections.allowInternally(ec2.Port.allTraffic());
    this.replicationGroup = this.newReplicationGroup(props, this.securityGroup);
  }

  newReplicationGroup(props: IProps, securityGroup: ec2.ISecurityGroup) {
    let privateSubnets: string[] = [];
    props.vpc.privateSubnets.forEach(function (value) {
      privateSubnets.push(value.subnetId);
    });

    const subnetGroup = new elasticache.CfnSubnetGroup(
      this,
      'ElastiCacheSubnetGroup',
      {
        description: 'ElasticacheSubnetGroup',
        subnetIds: privateSubnets,
        cacheSubnetGroupName: `${Config.Ns}SubnetGroup`,
      }
    );

    return new elasticache.CfnReplicationGroup(this, 'ReplicationGroup', {
      replicationGroupDescription: `${Config.Ns}Cluster`,
      atRestEncryptionEnabled: true,
      multiAzEnabled: true,
      cacheNodeType: 'cache.r6g.large',
      cacheSubnetGroupName: subnetGroup.cacheSubnetGroupName,
      engine: 'Redis',
      engineVersion: '6.x',
      numNodeGroups: 1,
      replicasPerNodeGroup: 1,
      securityGroupIds: [securityGroup.securityGroupId],
      port: 6379,
      transitEncryptionEnabled: true,
    });
  }
}
