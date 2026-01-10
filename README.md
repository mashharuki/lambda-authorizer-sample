# lambda-authorizer-sample

Lambda Authorizerのサンプルコード

## 動かし方

### インストール

```bash
pnpm i
```

### CloudFormation用のyamlファイルを生成

```bash
pnpm run cdk synth
```

### CDKスタックデプロイ

```bash
pnpm run cdk deploy '*'
```

### CDK スタック削除

```bash
pnpm run cdk destroy '*' --force
```