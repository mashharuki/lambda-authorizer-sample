import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * 参考となるLambda関数のハンドラー
 */
export const handler = async function (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  console.log(`event => ${JSON.stringify(event)}`);

  // Lambda Authorizerから渡されたコンテキストを取得
  const authorizer = (event.requestContext as any).authorizer;

  // contextに設定した値を利用できる(ここではユーザーIDとロールを取得)
  const userId = authorizer?.userId;
  const role = authorizer?.role;

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Hello from protected resource(Lambda Authorizer)',
      userId: userId,
      role: role,
    }),
  };
};
