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
    const cognitoStack = new CognitoStack(this, 'CognitoStack', props);
    // API Gatewayスタックの作成
    const apiGatewayStack = new ApiGatewayStack(this, 'ApiGatewayStack', cognitoStack.cognitoUserPool, cognitoStack.cognitoUserPoolAppClient, props);
    apiGatewayStack.addDependency(cognitoStack);

    // ====================================================================================
    // Outputs
    // ====================================================================================

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: cognitoStack.cognitoUserPool.userPoolId,
    });

    new cdk.CfnOutput(this, 'UserPoolAppClientId', {
      value: cognitoStack.cognitoUserPoolAppClient.userPoolClientId,
    });

    new cdk.CfnOutput(this, 'CognitoDomain', {
      value: cognitoStack.domainName,
      description: 'Cognito Domain',
      exportName: 'CognitoDomain',
    });

    new cdk.CfnOutput(this, 'TokenEndpoint', {
      value: cognitoStack.tokenEndpoint,
      description: 'Cognito OAuth2 Token Endpoint',
      exportName: 'CognitoTokenEndpoint',
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: apiGatewayStack.apiGatewayUrl.url,
      description: 'API Gateway URL',
      exportName: 'ApiGatewayUrl',
    });

    new cdk.CfnOutput(this, 'ApiGatewayEndpoint', {
      value: apiGatewayStack.apiGatewayEndpoint,
      description: 'API Gateway Awesome API Endpoint',
      exportName: 'ApiGatewayEndpoint',
    });

    new cdk.CfnOutput(this, 'AuthorizerLambdaArn', {
      value: apiGatewayStack.authorizerLambdaArn.functionArn,
      description: 'Lambda Authorizer Function ARN',
      exportName: 'AuthorizerLambdaArn',
    });

    new cdk.CfnOutput(this, 'ApiLambdaArn', {
      value: apiGatewayStack.apiLambdaArn.functionArn,
      description: 'API Lambda Function ARN',
      exportName: 'ApiLambdaArn',
    });
  }
}
