import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

/**
 * API Gatewayスタック
 */
export class ApiGatewayStack extends cdk.Stack {
  /**
   * コンストラクター
   * @param scope 
   * @param id 
   * @param cognitoUserPool 
   * @param cognitoUserPoolAppClient 
   * @param props 
   */
  constructor(scope: Construct,
              id: string,
              cognitoUserPool: cognito.IUserPool,
              cognitoUserPoolAppClient: cognito.IUserPoolClient,
              props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda Authorizer用のLambda関数の作成
    const authLambda = new lambdaNodejs.NodejsFunction(this, 'auth-lambda', {
      entry: './src/custom-auth-lambda.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_24_X,
      environment: {
        USERPOOL_ID: cognitoUserPool.userPoolId,
        CLIENT_ID: cognitoUserPoolAppClient.userPoolClientId,
        NODE_OPTIONS: '--enable-source-maps',
      },
    });

    // API用のLambda関数の作成
    const apiLambda = new lambdaNodejs.NodejsFunction(this, 'awesome-api-lambda', {
      entry: './src/api-lambda.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_24_X,
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
      },
    });
    
    // API Gatewayの作成
    const awesomeApi = new apigw.RestApi(this, 'awesome-api', {
      endpointTypes: [apigw.EndpointType.REGIONAL],
      deploy: true,
      deployOptions: {
        stageName: 'prod',
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
      },
    });

    // Lambda Authorizer with 'TOKEN' type
    // const authorizer = new apigw.TokenAuthorizer(this, 'awesome-api-authorizer', {
    //   handler: authLambda,
    //   identitySource: apigw.IdentitySource.header('authorization'),
    //   resultsCacheTtl: cdk.Duration.seconds(0),
    // });


    // Lambda Authorizer with 'REQUEST' type
    const authorizer = new apigw.RequestAuthorizer(this, 'awesome-api-request-authorizer', {
      handler: authLambda,
      identitySources: [apigw.IdentitySource.header('authorization')],
      resultsCacheTtl: cdk.Duration.minutes(30),
    });

    // PATH => /awesomeapi
    const awesomeApiResource = awesomeApi.root.addResource('awesomeapi');
    awesomeApiResource.addMethod(
      'GET',
      new apigw.LambdaIntegration(apiLambda),
      {
        methodResponses: [{
          statusCode: '200',
          responseParameters: {
            'method.response.header.Content-Type': true,
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        }],
        authorizer: authorizer,
        authorizationType: apigw.AuthorizationType.CUSTOM,
      },
    );

    // ====================================================================================
    // Outputs
    // ====================================================================================

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: awesomeApi.url,
      description: 'API Gateway URL',
      exportName: 'ApiGatewayUrl',
    });

    new cdk.CfnOutput(this, 'ApiGatewayEndpoint', {
      value: `${awesomeApi.url}awesomeapi`,
      description: 'API Gateway Awesome API Endpoint',
      exportName: 'ApiGatewayEndpoint',
    });

    new cdk.CfnOutput(this, 'AuthorizerLambdaArn', {
      value: authLambda.functionArn,
      description: 'Lambda Authorizer Function ARN',
      exportName: 'AuthorizerLambdaArn',
    });

    new cdk.CfnOutput(this, 'ApiLambdaArn', {
      value: apiLambda.functionArn,
      description: 'API Lambda Function ARN',
      exportName: 'ApiLambdaArn',
    });
  }
}
