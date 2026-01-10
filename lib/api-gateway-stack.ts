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

  readonly apiGatewayUrl: apigw.RestApi;
  readonly apiGatewayEndpoint: string;
  readonly authorizerLambdaArn: lambda.Function;
  readonly apiLambdaArn: lambda.Function;

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
      functionName: 'awesome-auth-lambda',
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
      functionName: 'awesome-api-lambda',
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

    // 値をセット
    this.apiGatewayUrl = awesomeApi;
    this.apiGatewayEndpoint = `${awesomeApi.url}awesomeapi`;
    this.authorizerLambdaArn = authLambda;
    this.apiLambdaArn = apiLambda;

    // ====================================================================================
    // Outputs
    // ====================================================================================

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.apiGatewayUrl.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'ApiGatewayEndpoint', {
      value: this.apiGatewayEndpoint,
      description: 'API Gateway Awesome API Endpoint',
    });

    new cdk.CfnOutput(this, 'AuthorizerLambdaArn', {
      value: this.authorizerLambdaArn.functionArn,
      description: 'Lambda Authorizer Function ARN',
    });

    new cdk.CfnOutput(this, 'ApiLambdaArn', {
      value: this.apiLambdaArn.functionArn,
      description: 'API Lambda Function ARN',
    });
  }
}
