#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/stacks/vpc-stack';
import { CacheStack } from '../lib/stacks/cache-stack';
import { Config } from '../lib/configs/loader';

const app = new cdk.App();

const vpcStack = new VpcStack(app, `${Config.Ns}VpcStack`, {
  vpcId: Config.VpcId,
  env: {
    account: Config.AWS.Account,
    region: Config.AWS.Region,
  },
});

const cacheStack = new CacheStack(app, `${Config.Ns}CacheStack`, {
  vpc: vpcStack.vpc,
});
cacheStack.addDependency(vpcStack);

const tags = cdk.Tags.of(app);
tags.add('namespace', Config.Ns);
tags.add('stage', Config.Stage);

app.synth();
