import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * 参考となるLambda関数のハンドラー
 */
export const handler = async function (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  console.log(`event => ${JSON.stringify(event)}`);

  return {
    statusCode: 200,
    body: 'Hello from protected resource(Lambda Authorizer)',
  };
};
