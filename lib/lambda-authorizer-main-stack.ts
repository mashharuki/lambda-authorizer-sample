import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CognitoStack } from './cognito-stack';
import { ApiGatewayStack } from './api-gateway-stack';

/**
 * Lambda Authorizerを用いたAPI Gateway構成をデプロイするためのメインスタック
 */
export class LambdaAuthorizerMainStack extends cdk.Stack {
  /**
   * コンストラクター
   * @param scope 
   * @param id 
   * @param props 
   */
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Cognitoスタックの作成
    const cognitoStack = new CognitoStack(this, 'CognitoStack');
    // API Gatewayスタックの作成
    const apiGatewayStack = new ApiGatewayStack(this, 'ApiGatewayStack', cognitoStack.cognitoUserPool, cognitoStack.cognitoUserPoolAppClient);
    apiGatewayStack.addDependency(cognitoStack);
  }
}
