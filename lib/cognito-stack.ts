import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

/**
 * Cognitoスタック
 */
export class CognitoStack extends cdk.Stack {
  readonly cognitoUserPool: cognito.IUserPool;
  readonly cognitoUserPoolAppClient: cognito.IUserPoolClient;

  /**
   * コンストラクター
   * @param scope 
   * @param id 
   * @param props 
   */
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Cognito User Poolの作成
    this.cognitoUserPool = new cognito.UserPool(this, 'awesome-cognito-user-pool', {
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Cognito User Pool App Clientの作成
    const awesomeApiReadScope = new cognito.ResourceServerScope({
      scopeName: 'awesomeapi.read',
      scopeDescription: 'awesomeapi read scope',
    });

    // Cognito User Pool Resource Serverの作成
    const resourceServer = new cognito.UserPoolResourceServer(this, 'awesome-resource-server', {
      identifier: 'awesomeapi-resource-server',
      userPool: this.cognitoUserPool,
      scopes: [awesomeApiReadScope],
    });

    // Cognito User Pool App Clientの作成
    this.cognitoUserPoolAppClient = new cognito.UserPoolClient(this, 'awesome-app-client', {
      userPool: this.cognitoUserPool,
      accessTokenValidity: cdk.Duration.minutes(60),
      generateSecret: true,
      refreshTokenValidity: cdk.Duration.days(1),
      enableTokenRevocation: true,
      oAuth: {
        flows: {
          clientCredentials: true,
        },
        scopes: [cognito.OAuthScope.resourceServer(resourceServer, awesomeApiReadScope)],
      },
    });

    const domain = this.cognitoUserPool.addDomain('awesome-cognito-domain', {
      cognitoDomain: {
        domainPrefix: 'buraktas-awesome-domain',
      },
    });

    // ====================================================================================
    // Outputs
    // ====================================================================================

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.cognitoUserPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'CognitoUserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.cognitoUserPoolAppClient.userPoolClientId,
      description: 'Cognito User Pool App Client ID',
      exportName: 'CognitoUserPoolClientId',
    });

    new cdk.CfnOutput(this, 'CognitoDomain', {
      value: domain.domainName,
      description: 'Cognito Domain',
      exportName: 'CognitoDomain',
    });

    new cdk.CfnOutput(this, 'TokenEndpoint', {
      value: `https://${domain.domainName}.auth.${cdk.Stack.of(this).region}.amazoncognito.com/oauth2/token`,
      description: 'Cognito OAuth2 Token Endpoint',
      exportName: 'CognitoTokenEndpoint',
    });
  }
}
